package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"cronix.ashutosh.net/internals/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type JobsHandler struct {
	js        *services.JobsService
	scheduler *services.Scheduler
}

func NewJobsHandler(js *services.JobsService, scheduler *services.Scheduler) *JobsHandler {
	return &JobsHandler{js: js, scheduler: scheduler}
}

type createJobReq struct {
	Name     string            `json:"name" binding:"required"`
	Schedule string            `json:"schedule" binding:"required"`
	Endpoint string            `json:"endpoint" binding:"required"`
	Method   string            `json:"method" binding:"required"`
	Headers  map[string]string `json:"headers"`
	Body     *string           `json:"body"`
	Active   bool              `json:"active"`
}

func (h *JobsHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var uid pgtype.UUID
	_ = uid.Scan(userID)

	var req createJobReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job, err := h.js.Create(c.Request.Context(), uid, req.Name, req.Schedule, req.Endpoint, req.Method, req.Headers, req.Body, req.Active)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Add job to scheduler if it's active
	if job.Active {
		if err := h.scheduler.AddJob(job); err != nil {
			// Log error but don't fail the request
			// The job is created in DB, just not scheduled
		}
	}

	c.JSON(http.StatusCreated, job)
}

func (h *JobsHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	var uid pgtype.UUID
	_ = uid.Scan(userID)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	jobs, err := h.js.ListByUser(context.Background(), uid, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

func (h *JobsHandler) Get(c *gin.Context) {
	var id pgtype.UUID
	_ = id.Scan(c.Param("id"))
	job, err := h.js.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, job)
}

func (h *JobsHandler) Update(c *gin.Context) {
	var id pgtype.UUID
	_ = id.Scan(c.Param("id"))
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job, err := h.js.Update(c.Request.Context(), id,
		getStrPtr(req["name"]), getStrPtr(req["schedule"]), getStrPtr(req["endpoint"]), getStrPtr(req["method"]),
		getHeadersPtr(req["headers"]), getStrPtr(req["body"]), getBoolPtr(req["active"]),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update scheduler
	if job.Active {
		if err := h.scheduler.AddJob(job); err != nil {
			// Log error but don't fail the request
		}
	} else {
		h.scheduler.RemoveJob(job.ID.String())
	}

	c.JSON(http.StatusOK, job)
}

func (h *JobsHandler) Delete(c *gin.Context) {
	var id pgtype.UUID
	_ = id.Scan(c.Param("id"))

	// Remove from scheduler first
	h.scheduler.RemoveJob(id.String())

	if err := h.js.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *JobsHandler) RunNow(c *gin.Context) {
	var id pgtype.UUID
	_ = id.Scan(c.Param("id"))
	job, err := h.js.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	log, err := h.js.RunOnce(c.Request.Context(), job)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	responseLog := map[string]interface{}{
		"id":     log.ID.String(),
		"job_id": log.JobID.String(),
		"status": log.Status,
	}
	if log.StartedAt.Valid {
		responseLog["started_at"] = log.StartedAt.Time.Format("2006-01-02T15:04:05Z07:00")
	}
	if log.FinishedAt.Valid {
		responseLog["finished_at"] = log.FinishedAt.Time.Format("2006-01-02T15:04:05Z07:00")
	}
	if log.DurationMs.Valid {
		responseLog["duration_ms"] = log.DurationMs.Int32
	}
	if log.ResponseCode.Valid {
		responseLog["response_code"] = log.ResponseCode.Int32
	}
	if log.Error.Valid {
		responseLog["error"] = log.Error.String
	}
	if log.ResponseBody.Valid {
		responseLog["response_body"] = log.ResponseBody.String
	}
	c.JSON(http.StatusOK, responseLog)
}

func (h *JobsHandler) ListLogs(c *gin.Context) {
	var id pgtype.UUID
	_ = id.Scan(c.Param("id"))

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, err := h.js.ListLogs(c.Request.Context(), id, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert pgtype structs to simple JSON-compatible structs
	responseLogs := make([]map[string]interface{}, len(logs))
	for i, log := range logs {
		responseLog := map[string]interface{}{
			"id":     log.ID.String(),
			"job_id": log.JobID.String(),
			"status": log.Status,
		}

		if log.StartedAt.Valid {
			responseLog["started_at"] = log.StartedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		}

		if log.FinishedAt.Valid {
			responseLog["finished_at"] = log.FinishedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		}

		if log.DurationMs.Valid {
			responseLog["duration_ms"] = log.DurationMs.Int32
		}

		if log.ResponseCode.Valid {
			responseLog["response_code"] = log.ResponseCode.Int32
		}

		if log.Error.Valid {
			responseLog["error"] = log.Error.String
		}

		if log.ResponseBody.Valid {
			responseLog["response_body"] = log.ResponseBody.String
		}

		responseLogs[i] = responseLog
	}

	c.JSON(http.StatusOK, responseLogs)
}

// New: Server-side endpoint test to avoid CORS
type testEndpointReq struct {
	Endpoint string            `json:"endpoint" binding:"required"`
	Method   string            `json:"method" binding:"required"`
	Headers  map[string]string `json:"headers"`
	Body     *string           `json:"body"`
}

func (h *JobsHandler) TestEndpoint(c *gin.Context) {
	var req testEndpointReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build request
	var bodyReader io.Reader
	if req.Body != nil {
		bodyReader = bytes.NewBufferString(*req.Body)
	}

	httpReq, err := http.NewRequest(req.Method, req.Endpoint, bodyReader)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}
	if httpReq.Header.Get("Content-Type") == "" {
		httpReq.Header.Set("Content-Type", "application/json")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	// Read body with a limit
	const maxRead = 1 << 20 // 1MB
	limited := io.LimitReader(resp.Body, maxRead)
	respBytes, _ := io.ReadAll(limited)

	// Try to parse JSON; if fails, return as string
	var parsed interface{}
	if len(respBytes) > 0 {
		if json.Unmarshal(respBytes, &parsed) != nil {
			parsed = string(respBytes)
		}
	}

	// Collect headers (first value only for simplicity)
	hdrs := map[string]string{}
	for k, vals := range resp.Header {
		if len(vals) > 0 {
			hdrs[k] = vals[0]
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      resp.StatusCode,
		"status_text": resp.Status,
		"headers":     hdrs,
		"body":        parsed,
	})
}

func getStrPtr(v interface{}) *string {
	if v == nil {
		return nil
	}
	s, ok := v.(string)
	if !ok {
		return nil
	}
	return &s
}
func getBoolPtr(v interface{}) *bool {
	if v == nil {
		return nil
	}
	b, ok := v.(bool)
	if !ok {
		return nil
	}
	return &b
}
func getHeadersPtr(v interface{}) *map[string]string {
	if v == nil {
		return nil
	}
	m, ok := v.(map[string]interface{})
	if !ok {
		return nil
	}
	out := map[string]string{}
	for k, val := range m {
		if str, ok := val.(string); ok {
			out[k] = str
		}
	}
	return &out
}
