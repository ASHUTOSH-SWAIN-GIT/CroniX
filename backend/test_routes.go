package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TestRoutesHandler handles test routes for endpoint validation
type TestRoutesHandler struct{}

// NewTestRoutesHandler creates a new test routes handler
func NewTestRoutesHandler() *TestRoutesHandler {
	return &TestRoutesHandler{}
}

// TestResponse represents a standard test response
type TestResponse struct {
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	Timestamp string    `json:"timestamp"`
	Data      *TestData `json:"data,omitempty"`
}

type TestData struct {
	Method      string            `json:"method"`
	URL         string            `json:"url"`
	Headers     map[string]string `json:"headers"`
	Body        interface{}       `json:"body,omitempty"`
	QueryParams map[string]string `json:"query_params,omitempty"`
}

// Success returns a successful response
func (h *TestRoutesHandler) Success(c *gin.Context) {
	response := TestResponse{
		Message:   "Test endpoint is working perfectly!",
		Status:    "success",
		Timestamp: time.Now().Format("2006-01-02T15:04:05Z07:00"),
		Data: &TestData{
			Method:  c.Request.Method,
			URL:     c.Request.URL.String(),
			Headers: getHeaders(c),
		},
	}

	// Add query parameters if any
	if len(c.Request.URL.Query()) > 0 {
		queryParams := make(map[string]string)
		for key, values := range c.Request.URL.Query() {
			if len(values) > 0 {
				queryParams[key] = values[0]
			}
		}
		response.Data.QueryParams = queryParams
	}

	// Add request body if present
	if c.Request.Body != nil {
		var body interface{}
		if err := c.ShouldBindJSON(&body); err == nil {
			response.Data.Body = body
		}
	}

	c.JSON(http.StatusOK, response)
}

// Error returns an error response (500)
func (h *TestRoutesHandler) Error(c *gin.Context) {
	response := TestResponse{
		Message:   "This endpoint intentionally returns an error",
		Status:    "error",
		Timestamp: time.Now().Format("2006-01-02T15:04:05Z07:00"),
		Data: &TestData{
			Method:  c.Request.Method,
			URL:     c.Request.URL.String(),
			Headers: getHeaders(c),
		},
	}

	c.JSON(http.StatusInternalServerError, response)
}

// NotFound returns a 404 response
func (h *TestRoutesHandler) NotFound(c *gin.Context) {
	response := TestResponse{
		Message:   "This endpoint returns a 404 Not Found",
		Status:    "not_found",
		Timestamp: time.Now().Format("2006-01-02T15:04:05Z07:00"),
		Data: &TestData{
			Method:  c.Request.Method,
			URL:     c.Request.URL.String(),
			Headers: getHeaders(c),
		},
	}

	c.JSON(http.StatusNotFound, response)
}

// Slow returns a response after a delay
func (h *TestRoutesHandler) Slow(c *gin.Context) {
	// Simulate slow response (2 seconds)
	time.Sleep(2 * time.Second)

	response := TestResponse{
		Message:   "This endpoint is slow but eventually responds",
		Status:    "success",
		Timestamp: time.Now().Format("2006-01-02T15:04:05Z07:00"),
		Data: &TestData{
			Method:  c.Request.Method,
			URL:     c.Request.URL.String(),
			Headers: getHeaders(c),
		},
	}

	c.JSON(http.StatusOK, response)
}

// Echo returns the request data back
func (h *TestRoutesHandler) Echo(c *gin.Context) {
	var requestBody interface{}
	if c.Request.Body != nil {
		if err := c.ShouldBindJSON(&requestBody); err != nil {
			requestBody = "Could not parse JSON body"
		}
	}

	response := TestResponse{
		Message:   "Echo endpoint - returns your request data",
		Status:    "success",
		Timestamp: time.Now().Format("2006-01-02T15:04:05Z07:00"),
		Data: &TestData{
			Method:  c.Request.Method,
			URL:     c.Request.URL.String(),
			Headers: getHeaders(c),
			Body:    requestBody,
		},
	}

	// Add query parameters if any
	if len(c.Request.URL.Query()) > 0 {
		queryParams := make(map[string]string)
		for key, values := range c.Request.URL.Query() {
			if len(values) > 0 {
				queryParams[key] = values[0]
			}
		}
		response.Data.QueryParams = queryParams
	}

	c.JSON(http.StatusOK, response)
}

// getHeaders extracts headers from the request
func getHeaders(c *gin.Context) map[string]string {
	headers := make(map[string]string)
	for key, values := range c.Request.Header {
		if len(values) > 0 {
			headers[key] = values[0]
		}
	}
	return headers
}

// SetupTestRoutes adds test routes to the gin router
func SetupTestRoutes(r *gin.Engine) {
	testHandler := NewTestRoutesHandler()

	// Test routes group
	testRoutes := r.Group("/test-routes")
	{
		// Success endpoint - returns 200 OK
		testRoutes.GET("/success", testHandler.Success)
		testRoutes.POST("/success", testHandler.Success)
		testRoutes.PUT("/success", testHandler.Success)
		testRoutes.DELETE("/success", testHandler.Success)

		// Error endpoint - returns 500 Internal Server Error
		testRoutes.GET("/error", testHandler.Error)
		testRoutes.POST("/error", testHandler.Error)

		// Not found endpoint - returns 404 Not Found
		testRoutes.GET("/notfound", testHandler.NotFound)
		testRoutes.POST("/notfound", testHandler.NotFound)

		// Slow endpoint - takes 2 seconds to respond
		testRoutes.GET("/slow", testHandler.Slow)
		testRoutes.POST("/slow", testHandler.Slow)

		// Echo endpoint - returns request data
		testRoutes.GET("/echo", testHandler.Echo)
		testRoutes.POST("/echo", testHandler.Echo)
		testRoutes.PUT("/echo", testHandler.Echo)
		testRoutes.DELETE("/echo", testHandler.Echo)
	}

	log.Println("Test routes registered:")
	log.Println("  GET/POST/PUT/DELETE /test-routes/success - Returns 200 OK")
	log.Println("  GET/POST /test-routes/error - Returns 500 Internal Server Error")
	log.Println("  GET/POST /test-routes/notfound - Returns 404 Not Found")
	log.Println("  GET/POST /test-routes/slow - Takes 2 seconds, returns 200 OK")
	log.Println("  GET/POST/PUT/DELETE /test-routes/echo - Returns request data")
}
