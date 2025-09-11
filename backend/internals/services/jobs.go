package services

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"cronix.ashutosh.net/internals/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type JobsService struct {
	q *db.Queries
}

func NewJobsService(q *db.Queries) *JobsService { return &JobsService{q: q} }

func (s *JobsService) Create(ctx context.Context, userID pgtype.UUID, name, sched, endpoint, method string, headers map[string]string, body *string, active bool) (db.Job, error) {
	h, _ := json.Marshal(headers)
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
	if headers != nil {
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
