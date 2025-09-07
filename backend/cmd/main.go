package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
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

}
