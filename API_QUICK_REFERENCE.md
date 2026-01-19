# Authentication API Quick Reference

## Base URL
```
http://localhost:3000/api
```

## Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/send-otp` | No | Send OTP to phone number |
| POST | `/auth/verify-otp` | No | Verify OTP code |
| POST | `/auth/register` | No | Complete registration |
| POST | `/auth/login` | No | Login with credentials |
| GET | `/auth/profile` | Yes | Get user profile |
| PUT | `/auth/profile` | Yes | Update user profile |

## Request Examples

### 1. Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

### 2. Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```

### 3. Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "password": "securePassword123",
    "name": "John Doe",
    "userType": "FARMER",
    "location": "California"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "password": "securePassword123"
  }'
```

### 5. Get Profile (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Update Profile (Protected)
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "location": "New York"
  }'
```

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (Registration successful) |
| 400 | Bad Request (Validation error) |
| 401 | Unauthorized (Invalid credentials or token) |
| 403 | Forbidden (Phone not verified) |
| 409 | Conflict (User already exists) |

## Testing with Postman

1. Import the following collection:

```json
{
  "info": {
    "name": "Suq l-Filaha Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Send OTP",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phoneNumber\": \"+1234567890\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/auth/send-otp",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "send-otp"]
        }
      }
    },
    {
      "name": "Verify OTP",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phoneNumber\": \"+1234567890\",\n  \"code\": \"123456\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/auth/verify-otp",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "verify-otp"]
        }
      }
    },
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phoneNumber\": \"+1234567890\",\n  \"password\": \"securePassword123\",\n  \"name\": \"John Doe\",\n  \"userType\": \"FARMER\",\n  \"location\": \"California\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/auth/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "register"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phoneNumber\": \"+1234567890\",\n  \"password\": \"securePassword123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": {
          "raw": "http://localhost:3000/api/auth/profile",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "profile"]
        }
      }
    }
  ]
}
```

2. Set up environment variable `token` after login

## Mobile App Integration

The mobile app automatically handles:
- Token storage in AsyncStorage
- Token injection in request headers
- Auto-logout on 401 responses
- Navigation based on auth state

See `mobile-app/src/services/api.ts` for implementation details.
