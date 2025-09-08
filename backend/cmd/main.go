package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
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

	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		panic(err)
	}
	defer conn.Close(context.Background())

	fmt.Println("Connected to the datase successfully !!!")

	queries := db.New(conn)
	authConfig := config.LoadAuthConfig()
	authService := services.NewAuthService(queries, authConfig.JWTSecret)

	authHandler := handlers.NewAuthHandler(authService, authConfig)

	r := gin.Default()

	r.GET("/auth/google", authHandler.Login)
	r.GET("/auth/google/callback", authHandler.Callback)
	r.POST("/auth/logout", authHandler.Logout)

	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(authService))
	{
		protected.GET("/profile", authHandler.GetProfile)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)

}
