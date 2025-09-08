package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"cronix.ashutosh.net/internals/services"
	"cronix.ashutosh.net/internals/db"
)


type JobsHandler struct{
	js *services.AuthService
}

func NewJobsHandler(js *services.JobsService) *JobsHandler{return &JobsHandler{js:js}}

type createJobReq struct {
	Name     string            `json:"name" binding:"required"`
	Schedule string            `json:"schedule" binding:"required"`
	Endpoint string            `json:"endpoint" binding:"required"`
	Method   string            `json:"method" binding:"required"`
	Headers  map[string]string `json:"headers"`
	Body     *string           `json:"body"`
	Active   bool              `json:"active"`
}


func (h *JobsHandler) Create (c *gin.Context){
	userID := c.GetString("user_id")
	var uid pgtype.UUID;_ = uid.Scan(userID)

	var req createJobReq
	if err := c.ShouldBindJSON(&req);err != nil{
		c.JSON(http.StatusBadRequest , gin.H{"error":err.Error()}) ; return
	}

	
}