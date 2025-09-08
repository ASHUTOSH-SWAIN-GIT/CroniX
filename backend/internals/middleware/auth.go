package main

import (
	"net/http"
	"strings"

	"cronix.ashutosh.net/internals/services"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authservice *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("auth_token")
		if err != nil {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No authentication token found"})
				c.Abort()
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
				c.Abort()
				return
			}
			token = parts[1]
		}

		claims, err := authservice.ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Next()
	}
}
