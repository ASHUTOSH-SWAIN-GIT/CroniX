package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	googleoauth2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"

	"cronix.ashutosh.net/internals/config"
	"cronix.ashutosh.net/internals/services"
)

type AuthHandler struct {
	authService *services.AuthService
	authConfig  *config.AuthConfig
}

func NewAuthHandler(authService *services.AuthService, authConfig *config.AuthConfig) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		authConfig:  authConfig,
	}
}

// Login initiates Google OAuth flow
func (h *AuthHandler) Login(c *gin.Context) {
	state, err := services.GenerateState()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate state"})
		return
	}

	// Store state in session/cookie for validation
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)

	// Get prompt parameter from query string (e.g., prompt=select_account)
	prompt := c.Query("prompt")

	// Create auth options
	authOptions := []oauth2.AuthCodeOption{oauth2.AccessTypeOffline}
	if prompt != "" {
		authOptions = append(authOptions, oauth2.SetAuthURLParam("prompt", prompt))
	}

	url := h.authConfig.GooglelOauthConfig.AuthCodeURL(state, authOptions...)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// Callback handles Google OAuth callback
func (h *AuthHandler) Callback(c *gin.Context) {
	ctx := context.Background()

	// Verify state parameter
	state := c.Query("state")
	cookieState, err := c.Cookie("oauth_state")
	if err != nil || state != cookieState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}

	// Exchange code for token
	code := c.Query("code")
	token, err := h.authConfig.GooglelOauthConfig.Exchange(ctx, code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token"})
		return
	}

	// Get user info from Google
	oauth2Service, err := googleoauth2.NewService(ctx, option.WithTokenSource(h.authConfig.GooglelOauthConfig.TokenSource(ctx, token)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create OAuth2 service"})
		return
	}

	userInfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	// Create or get user from database
	user, err := h.authService.CreateOrGetUser(ctx, userInfo.Email, userInfo.Name, userInfo.Picture)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create/get user"})
		return
	}

	// Generate JWT token with proper UUID string
	userIDStr := user.ID.String()
	jwtToken, err := h.authService.GenerateJWT(userIDStr, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Redirect to frontend with JWT token as query parameter
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	// Pass the JWT token as a query parameter to the frontend
	redirectURL := fmt.Sprintf("%s/dashboard?token=%s", frontendURL, jwtToken)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// Logout endpoint (frontend will handle clearing localStorage)
func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetProfile returns current user profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ctx := context.Background()
	user, err := h.authService.GetUserByID(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"email":      user.Email,
		"name":       user.Name,
		"avatar_url": user.AvatarUrl,
		"created_at": user.CreatedAt,
	})
}
