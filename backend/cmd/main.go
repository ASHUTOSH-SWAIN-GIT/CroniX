package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"cronix.ashutosh.net/internals/config"
	"cronix.ashutosh.net/internals/db"
	"cronix.ashutosh.net/internals/handlers"
	"cronix.ashutosh.net/internals/middleware"
	"cronix.ashutosh.net/internals/services"
)

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func LoadDBconfig() (*DBConfig, error) {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("NO .env file found ")
	}

	portStr := os.Getenv("DB_PORT")
	if portStr == "" {
		portStr = "5432" // default port
	}

	cfg := &DBConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     portStr,
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		Name:     os.Getenv("DB_NAME"),
		SSLMode:  os.Getenv("DB_SSLMODE"),
	}

	return cfg, nil

}

func main() {
	cfg, err := LoadDBconfig()
	if err != nil {
		panic(err)
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Name, cfg.SSLMode,
	)

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		panic(err)
	}
	defer pool.Close()

	fmt.Println("Connected to the datase successfully !!!")

	queries := db.New(pool)
	authConfig := config.LoadAuthConfig()
	authService := services.NewAuthService(queries, authConfig.JWTSecret)

	jobsService := services.NewJobsService(queries)
	scheduler := services.NewScheduler(jobsService)
	jobsHandler := handlers.NewJobsHandler(jobsService, scheduler)

	// After creating queries, jobsService, scheduler
	activeJobs, err := queries.ListActiveJobs(context.Background())
	if err != nil {
		log.Printf("failed to load active jobs: %v", err)
	}
	if err := scheduler.Start(context.Background(), activeJobs); err != nil {
		log.Printf("failed to start scheduler: %v", err)
	} else {
		log.Printf("scheduler started with %d active jobs", len(activeJobs))
	}

	authHandler := handlers.NewAuthHandler(authService, authConfig)

	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	r.GET("/auth/google", authHandler.Login)
	r.GET("/auth/google/callback", authHandler.Callback)
	r.POST("/auth/logout", authHandler.Logout)

	// Test routes (no auth required for testing)
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":   "Backend is working!",
			"timestamp": "2024-01-01T00:00:00Z",
			"status":    "success",
		})
	})

	// Webhook test endpoint that jobs can hit
	r.POST("/webhook/test", func(c *gin.Context) {
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": "Invalid JSON"})
			return
		}

		c.JSON(200, gin.H{
			"message":       "Webhook received successfully!",
			"received_data": body,
			"timestamp":     "2024-01-01T00:00:00Z",
			"status":        "success",
		})
	})

	// Simple GET webhook test
	r.GET("/webhook/test", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":   "GET webhook test successful!",
			"timestamp": "2024-01-01T00:00:00Z",
			"status":    "success",
		})
	})

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(authService))
	{
		api.GET("/profile", authHandler.GetProfile)
		api.POST("/jobs", jobsHandler.Create)
		api.GET("/jobs", jobsHandler.List)
		api.GET("/jobs/:id", jobsHandler.Get)
		api.PUT("/jobs/:id", jobsHandler.Update)
		api.DELETE("/jobs/:id", jobsHandler.Delete)
		api.POST("/jobs/:id/run", jobsHandler.RunNow)
		api.GET("/jobs/:id/logs", jobsHandler.ListLogs)
		api.POST("/jobs/test", jobsHandler.TestEndpoint)
		api.POST("/jobs/cleanup-logs", jobsHandler.CleanupAllLogs)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)

	// Graceful shutdown
	defer func() {
		log.Println("Stopping scheduler...")
		scheduler.Stop()
	}()

	r.Run(":" + port)

}
