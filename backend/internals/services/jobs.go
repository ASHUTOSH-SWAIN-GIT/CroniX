package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"cronix.ashutosh.net/internals/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type JobsService struct {
	q *db.Queries
}

func NewJobsService(q *db.Queries) *JobsService { return &JobsService{q: q} }

func (s *JobsService) Create(ctx context.Context, userID pgtype.UUID, name, sched, endpoint, method string, headers map[string]string, body *string, active bool) (db.Job, error) {
	var h []byte
	if len(headers) > 0 {
		h, _ = json.Marshal(headers)
	}
	return s.q.CreateJob(ctx, db.CreateJobParams{
		UserID:   userID,
		Name:     name,
		Schedule: sched,
		Endpoint: endpoint,
		Method:   method,
		Headers:  h,
		Body:     pgtype.Text{String: getStr(body), Valid: body != nil},
		Active:   active,
	})
}

func (s *JobsService) Update(ctx context.Context, id pgtype.UUID, name, schedule, endpoint, method *string, headers *map[string]string, body *string, active *bool) (db.Job, error) {
	var hdr []byte
	if headers != nil && len(*headers) > 0 {
		hdr, _ = json.Marshal(*headers)
	}

	return s.q.UpdateJob(ctx, db.UpdateJobParams{
		ID:      id,
		Column2: getStr(name),     // name
		Column3: getStr(schedule), // schedule
		Column4: getStr(endpoint), // endpoint
		Column5: getStr(method),   // method
		Headers: hdr,
		Body:    toTextPtr(body),
		Active:  getBool(active),
	})
}

func (s *JobsService) Get(ctx context.Context, id pgtype.UUID) (db.Job, error) {
	return s.q.GetJob(ctx, id)
}

func (s *JobsService) Delete(ctx context.Context, id pgtype.UUID) error {
	return s.q.DeleteJob(ctx, id)
}

func (s *JobsService) RunOnce(ctx context.Context, job db.Job) (db.JobLog, error) {
	start := time.Now()
	code := 0
	status := "success"

	var errStr string
	var respBodyStr string

	hasResp := false
	reqBody := []byte(nil)
	if job.Body.Valid {
		reqBody = []byte(job.Body.String)
	}
	req, newReqErr := http.NewRequest(job.Method, job.Endpoint, bytes.NewReader(reqBody))
	if newReqErr != nil {
		status, errStr = "failure", newReqErr.Error()
	} else {
		if len(job.Headers) > 0 {
			var hdr map[string]string
			_ = json.Unmarshal(job.Headers, &hdr)
			for k, v := range hdr {
				req.Header.Set(k, v)
			}
		}

		resp, err := http.DefaultClient.Do(req)
		if resp != nil && resp.Body != nil {
			const max = 1 << 20 // 1MB
			limited := io.LimitReader(resp.Body, max)
			b, _ := io.ReadAll(limited)
			respBodyStr = string(b)
			resp.Body.Close()
		}
		if err != nil {
			status, errStr = "failure", err.Error()
		}
		if resp != nil {
			code = resp.StatusCode
			hasResp = true
		}
	}

	dur := int32(time.Since(start).Milliseconds())
	newLog, err := s.q.InsertJobLog(ctx, db.InsertJobLogParams{
		JobID:        job.ID,
		StartedAt:    pgtype.Timestamptz{Time: start, Valid: true},
		FinishedAt:   pgtype.Timestamptz{Time: time.Now(), Valid: true},
		DurationMs:   pgtype.Int4{Int32: dur, Valid: true},
		Status:       status,
		ResponseCode: pgtype.Int4{Int32: int32(code), Valid: hasResp},
		Error:        pgtype.Text{String: errStr, Valid: errStr != ""},
		ResponseBody: pgtype.Text{String: respBodyStr, Valid: respBodyStr != ""},
	})

	if err != nil {
		return newLog, err
	}

	// Clean up old logs, keeping only the 5 most recent
	// We ignore errors here as cleanup is not critical
	_ = s.CleanupOldLogs(ctx, job.ID)

	return newLog, nil
}

func (s *JobsService) ListLogs(ctx context.Context, jobID pgtype.UUID, limit, offset int32) ([]db.JobLog, error) {
	return s.q.ListJobLogs(ctx, db.ListJobLogsParams{
		JobID:  jobID,
		Limit:  limit,
		Offset: offset,
	})
}

func (s *JobsService) ListRecentLogs(ctx context.Context, jobID pgtype.UUID) ([]db.JobLog, error) {
	return s.q.ListRecentJobLogs(ctx, jobID)
}

func (s *JobsService) CleanupOldLogs(ctx context.Context, jobID pgtype.UUID) error {
	return s.q.DeleteOldJobLogs(ctx, jobID)
}

func (s *JobsService) CleanupAllOldLogs(ctx context.Context) error {
	return s.q.CleanupAllOldLogs(ctx)
}

func toTextPtr(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}
func toJSONBPtr(b []byte, ok bool) []byte {
	if !ok {
		return nil
	}
	return b
}
func toBoolPtr(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}
func getStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func getBool(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

func (s *JobsService) ListByUser(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]db.Job, error) {
	return s.q.ListJobsByUser(ctx, db.ListJobsByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
}

// TestEndpoint tests an endpoint before creating a job
func (s *JobsService) TestEndpoint(ctx context.Context, endpoint, method string, headers map[string]string, body *string) error {
	// Validate method first
	validMethods := []string{"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
	isValidMethod := false
	for _, validMethod := range validMethods {
		if method == validMethod {
			isValidMethod = true
			break
		}
	}
	if !isValidMethod {
		return fmt.Errorf("invalid HTTP method '%s'. Supported methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS", method)
	}

	// Validate endpoint URL
	if endpoint == "" {
		return fmt.Errorf("endpoint URL is required")
	}

	// Build request
	var bodyReader io.Reader
	if body != nil {
		bodyReader = bytes.NewBufferString(*body)
	}

	httpReq, err := http.NewRequestWithContext(ctx, method, endpoint, bodyReader)
	if err != nil {
		// Check for specific URL parsing errors
		if strings.Contains(err.Error(), "invalid URL") {
			return fmt.Errorf("invalid endpoint URL format: %s. Please ensure the URL starts with http:// or https://", endpoint)
		}
		return fmt.Errorf("invalid endpoint URL: %v", err)
	}

	// Set headers
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}
	if httpReq.Header.Get("Content-Type") == "" && body != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}

	// Make request with timeout
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		// Check for specific connection errors
		if strings.Contains(err.Error(), "no such host") {
			return fmt.Errorf("endpoint host not found: %s. Please check if the domain name is correct", endpoint)
		}
		if strings.Contains(err.Error(), "connection refused") {
			return fmt.Errorf("connection refused to endpoint: %s. The server may be down or not accepting connections", endpoint)
		}
		if strings.Contains(err.Error(), "timeout") {
			return fmt.Errorf("request timeout to endpoint: %s. The server took too long to respond", endpoint)
		}
		if strings.Contains(err.Error(), "certificate") {
			return fmt.Errorf("SSL certificate error for endpoint: %s. Please check if the HTTPS certificate is valid", endpoint)
		}
		return fmt.Errorf("failed to reach endpoint: %v", err)
	}
	defer resp.Body.Close()

	// Check if response is successful (2xx status codes)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		switch resp.StatusCode {
		case 400:
			return fmt.Errorf("endpoint returned Bad Request (400): %s. Please check your request parameters and body", endpoint)
		case 401:
			return fmt.Errorf("endpoint returned Unauthorized (401): %s. Please check your authentication credentials", endpoint)
		case 403:
			return fmt.Errorf("endpoint returned Forbidden (403): %s. You don't have permission to access this endpoint", endpoint)
		case 404:
			return fmt.Errorf("endpoint returned Not Found (404): %s. The endpoint path does not exist", endpoint)
		case 405:
			return fmt.Errorf("endpoint returned Method Not Allowed (405): %s. The HTTP method '%s' is not supported by this endpoint", endpoint, method)
		case 500:
			return fmt.Errorf("endpoint returned Internal Server Error (500): %s. The server encountered an error", endpoint)
		case 502:
			return fmt.Errorf("endpoint returned Bad Gateway (502): %s. The server is acting as a gateway and received an invalid response", endpoint)
		case 503:
			return fmt.Errorf("endpoint returned Service Unavailable (503): %s. The server is temporarily unavailable", endpoint)
		case 504:
			return fmt.Errorf("endpoint returned Gateway Timeout (504): %s. The server took too long to respond", endpoint)
		default:
			return fmt.Errorf("endpoint returned error status %d (%s): %s", resp.StatusCode, resp.Status, endpoint)
		}
	}

	return nil
}
