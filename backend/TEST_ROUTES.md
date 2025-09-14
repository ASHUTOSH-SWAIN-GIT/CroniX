# Test Routes for Endpoint Validation

This document describes the test routes available for testing endpoint validation in your Cronix application.

## Available Test Routes

All test routes are prefixed with `/test-routes/` and are available without authentication.

### 1. Success Endpoint

**URL:** `/test-routes/success`  
**Methods:** GET, POST, PUT, DELETE  
**Response:** 200 OK  
**Description:** Always returns a successful response. Perfect for testing valid endpoints.

**Example Response:**

```json
{
  "message": "Test endpoint is working perfectly!",
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "method": "GET",
    "url": "/test-routes/success",
    "headers": {
      "Content-Type": "application/json",
      "User-Agent": "curl/7.68.0"
    }
  }
}
```

### 2. Error Endpoint

**URL:** `/test-routes/error`  
**Methods:** GET, POST  
**Response:** 500 Internal Server Error  
**Description:** Always returns an error response. Use this to test how your application handles failed endpoint validation.

**Example Response:**

```json
{
  "message": "This endpoint intentionally returns an error",
  "status": "error",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "method": "GET",
    "url": "/test-routes/error",
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### 3. Not Found Endpoint

**URL:** `/test-routes/notfound`  
**Methods:** GET, POST  
**Response:** 404 Not Found  
**Description:** Returns a 404 error. Useful for testing endpoint validation with non-existent resources.

**Example Response:**

```json
{
  "message": "This endpoint returns a 404 Not Found",
  "status": "not_found",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "method": "GET",
    "url": "/test-routes/notfound",
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### 4. Slow Endpoint

**URL:** `/test-routes/slow`  
**Methods:** GET, POST  
**Response:** 200 OK (after 2 seconds)  
**Description:** Takes 2 seconds to respond. Useful for testing timeout scenarios and slow endpoints.

**Example Response:**

```json
{
  "message": "This endpoint is slow but eventually responds",
  "status": "success",
  "timestamp": "2024-01-15T10:30:02Z",
  "data": {
    "method": "GET",
    "url": "/test-routes/slow",
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### 5. Echo Endpoint

**URL:** `/test-routes/echo`  
**Methods:** GET, POST, PUT, DELETE  
**Response:** 200 OK  
**Description:** Returns all request data back to you. Perfect for testing with custom headers, body, and query parameters.

**Example Request:**

```bash
curl -X POST http://localhost:8080/test-routes/echo \
  -H "Content-Type: application/json" \
  -H "X-Custom-Header: test-value" \
  -d '{"test": "data", "number": 123}'
```

**Example Response:**

```json
{
  "message": "Echo endpoint - returns your request data",
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "method": "POST",
    "url": "/test-routes/echo",
    "headers": {
      "Content-Type": "application/json",
      "X-Custom-Header": "test-value"
    },
    "body": {
      "test": "data",
      "number": 123
    }
  }
}
```

## Testing Job Creation with These Routes

### Valid Endpoint (Should Succeed)

```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Success Job",
    "schedule": "0 */5 * * * *",
    "endpoint": "http://localhost:8080/test-routes/success",
    "method": "GET",
    "active": true
  }'
```

### Invalid Endpoint (Should Fail)

```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Error Job",
    "schedule": "0 */5 * * * *",
    "endpoint": "http://localhost:8080/test-routes/error",
    "method": "GET",
    "active": true
  }'
```

### POST Request with Body (Should Succeed)

```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Echo Job",
    "schedule": "0 */5 * * * *",
    "endpoint": "http://localhost:8080/test-routes/echo",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "X-Custom-Header": "test-value"
    },
    "body": "{\"message\": \"Hello from cron job!\"}",
    "active": true
  }'
```

## Expected Behavior

- **Success Endpoint**: Job creation should succeed ✅
- **Error Endpoint**: Job creation should fail with endpoint validation error ❌
- **Not Found Endpoint**: Job creation should fail with endpoint validation error ❌
- **Slow Endpoint**: Job creation should succeed (within 30s timeout) ✅
- **Echo Endpoint**: Job creation should succeed ✅

## Error Messages

When endpoint validation fails, you'll receive responses like:

```json
{
  "error": "Endpoint test failed",
  "details": "endpoint returned error status 500: 500 Internal Server Error",
  "message": "Please check your endpoint URL, method, headers, and body. Make sure the endpoint is accessible and returns a successful response (2xx status code)."
}
```

This helps you understand exactly what went wrong with your endpoint configuration.
