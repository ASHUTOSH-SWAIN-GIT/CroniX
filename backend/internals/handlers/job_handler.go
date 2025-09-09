package handlers

import (
	"context"
	"net/http"
	"strconv"

	"cronix.ashutosh.net/internals/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type JobsHandler struct {
	js *services.JobsService
}

func NewJobsHandler(js *services.JobsService) *JobsHandler { return &JobsHandler{js: js} }

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
	c.JSON(http.StatusOK, job)
}

func (h *JobsHandler) Delete(c *gin.Context) {
	var id pgtype.UUID
	_ = id.Scan(c.Param("id"))
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
	c.JSON(http.StatusOK, log)
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
