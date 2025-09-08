// Fix the syntax errors in auth.go
package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"cronix.ashutosh.net/internals/db"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type AuthService struct {
	queries   *db.Queries
	jwtSecret string // Fixed: was jwtsecret
}

type Claims struct {
	UserID string `json:"user_id"` // Fixed: removed extra 'i'
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func NewAuthService(queries *db.Queries, jwtSecret string) *AuthService { // Fixed: was jwtsecret
	return &AuthService{
		queries:   queries,
		jwtSecret: jwtSecret, // Fixed: was jwtsecret
	}
}

func (s *AuthService) CreateOrGetUser(ctx context.Context, email, name, avatarURL string) (*db.User, error) {
	// Try to get existing user
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err == nil {
		return &user, nil
	}

	// Create new user if doesn't exist
	newUser, err := s.queries.CreateUser(ctx, db.CreateUserParams{
		Email:     email,
		Name:      pgtype.Text{String: name, Valid: name != ""}, // Fixed: was name!=" "
		AvatarUrl: pgtype.Text{String: avatarURL, Valid: avatarURL != ""},
		Provider:  "google",
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err) // Fixed: was "falied"
	}

	return &newUser, nil
}

func (s *AuthService) GenerateJWT(userID, email string) (string, error) { // Fixed: spacing
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret)) // Fixed: was jwtsecret
}

func (s *AuthService) ValidateJWT(tokenString string) (*Claims, error) { // Fixed: spacing
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) { // Fixed: spacing
		return []byte(s.jwtSecret), nil // Fixed: was jwtsecret
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*db.User, error) {
	// Convert string to UUID
	var uuid pgtype.UUID
	if err := uuid.Scan(userID); err != nil {
		return nil, err
	}

	user, err := s.queries.GetUser(ctx, uuid)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GenerateState() (string, error) { // Fixed: spacing
	bytes := make([]byte, 32)                   // Fixed: spacing
	if _, err := rand.Read(bytes); err != nil { // Fixed: spacing
		return "", err
	}

	return hex.EncodeToString(bytes), nil // Fixed: spacing
}
