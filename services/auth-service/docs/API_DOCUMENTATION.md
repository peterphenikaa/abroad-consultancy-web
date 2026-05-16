# Auth & User Management API - Swagger Documentation

## 📚 Overview

This document describes the updated Swagger/OpenAPI documentation for the 7 new endpoints in the Auth & User Management Service.

### What Has Been Implemented

**Option A: Standalone `swagger.yaml`** - Single source of truth for API contract  
 **Swagger UI** - Interactive documentation at `/docs`  
 **Detailed Response Schemas** - Complete component definitions  
 **Distributed Docs, Centralized UI** - Service-level YAML files, gateway-level consolidation

---

## 📋 Documented Endpoints

### Email & Password Group (Public Routes - No Auth Required)

| #   | Endpoint                              | Method | Purpose                            |
| --- | ------------------------------------- | ------ | ---------------------------------- |
| 1   | `/api/auth/verify-email`              | POST   | Verify email with 6-digit OTP      |
| 2   | `/api/auth/forgot-password`           | POST   | Request password reset via email   |
| 3   | `/api/auth/reset-password/verify-otp` | POST   | Verify OTP and get reset token     |
| 4   | `/api/auth/reset-password`            | POST   | Complete password reset with token |

### Profile Group (Protected Routes - Bearer Token Required)

| #   | Endpoint              | Method | Purpose                     | Role                   |
| --- | --------------------- | ------ | --------------------------- | ---------------------- |
| 5   | `/api/users/me`       | GET    | Get current user profile    | Any authenticated user |
| 6   | `/api/users/me`       | PATCH  | Update current user profile | Any authenticated user |
| 7   | `/api/users/{userId}` | GET    | Get user profile by ID      | SUPER_ADMIN only       |

---

## 🏗️ Architecture

### Service-Level Documentation (Auth Service)

**File Location:** `services/auth-service/docs/swagger.yaml`

Contains:

- Complete OpenAPI 3.0.0 specification
- All 7 endpoint definitions with detailed descriptions
- Request/response schemas with examples
- Error response types (400, 401, 403, 404, 500)
- Security scheme definition (Bearer JWT)
- Component schemas for reusability

**How to Access (Direct Service):**

```
Local: http://localhost:3001/docs
```

### Gateway-Level Consolidation (API Gateway)

**File Location:** `api-gateway/src/index.js`

Features:

- Automatically merges all microservice Swagger specs
- Consolidates paths, schemas, and tags
- Serves unified documentation at gateway level
- Provides multiple output formats:
  - **Interactive UI**: `/docs`
  - **OpenAPI JSON**: `/swagger.json`
  - **OpenAPI YAML**: `/swagger.yaml`

**How to Access (Via Gateway):**

```
Gateway: http://localhost:8081/docs
JSON: http://localhost:8081/api/swagger.json
YAML: http://localhost:8081/api/swagger.yaml
```

---

## 📝 Swagger Specification Details

### Request/Response Format

#### 1. POST /api/auth/verify-email

**Public endpoint**

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response (200 OK):

```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 2. POST /api/auth/forgot-password

**Public endpoint**

Request:

```json
{
  "email": "user@example.com"
}
```

Response (200 OK):

```json
{
  "success": true,
  "message": "OTP sent to your email. Please check your inbox."
}
```

---

#### 3. POST /api/auth/reset-password/verify-otp

**Public endpoint**

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response (200 OK):

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Reset token is valid for 15 minutes.

---

#### 4. POST /api/auth/reset-password

**Public endpoint**

Request:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePassword123!"
}
```

Response (200 OK):

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

#### 5. GET /api/users/me

**Protected endpoint - Bearer token required**

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z",
    "profile": {
      "bio": "Full-stack developer",
      "avatarUrl": "https://cdn.example.com/avatars/user123.jpg",
      "educationalLevel": "Bachelor's in CS",
      "learningGoals": "Master microservices"
    }
  }
}
```

---

#### 6. PATCH /api/users/me

**Protected endpoint - Bearer token required**

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request (all fields optional):

```json
{
  "fullName": "John Doe Updated",
  "bio": "Senior backend engineer",
  "avatarUrl": "https://cdn.example.com/avatars/user123-v2.jpg",
  "educationalLevel": "Master's in Software Engineering",
  "learningGoals": "Advanced system design patterns"
}
```

Response (200 OK):

```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe Updated",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T16:00:00Z",
    "profile": {
      "bio": "Senior backend engineer",
      "avatarUrl": "https://cdn.example.com/avatars/user123-v2.jpg",
      "educationalLevel": "Master's in Software Engineering",
      "learningGoals": "Advanced system design patterns"
    }
  }
}
```

---

#### 7. GET /api/users/{userId}

**Protected endpoint - SUPER_ADMIN role required**

Headers:

```
Authorization: Bearer <admin_jwt_token>
```

URL Parameter:

```
/api/users/550e8400-e29b-41d4-a716-446655440111
```

Response (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440111",
    "email": "targetuser@example.com",
    "fullName": "Target User",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z",
    "profile": {
      "bio": "...",
      "avatarUrl": "...",
      "educationalLevel": "...",
      "learningGoals": "..."
    }
  }
}
```

---

## ⚠️ Error Responses

### 400 Bad Request

Validation errors or invalid input

```json
{
  "success": false,
  "message": "Email Verification Validation Error",
  "code": "VALIDATION_ERROR",
  "errors": {
    "email": ["Invalid email address"],
    "otp": ["OTP must be exactly 6 characters long"]
  }
}
```

### 401 Unauthorized

Missing or invalid JWT token / OTP expired

```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden

User lacks required permissions (not an admin)

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

Resource not found

```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND"
}
```

### 500 Internal Server Error

Server-side error

```json
{
  "error": {
    "type": "about:blank",
    "title": "Internal Server Error",
    "status": 500,
    "detail": "Something went wrong",
    "code": "INTERNAL_ERROR"
  }
}
```

---

## 🔐 Security

### Public Routes (No Authentication)

- POST `/api/auth/verify-email`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password/verify-otp`
- POST `/api/auth/reset-password`

These endpoints are accessible without any JWT token.

### Protected Routes (Bearer Token Required)

- GET `/api/users/me`
- PATCH `/api/users/me`
- GET `/api/users/{userId}` (SUPER_ADMIN only)

To access these endpoints, include the JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Gateway Middleware

The API Gateway enforces JWT validation on all protected routes. Public routes bypass authentication.

---

## 🎯 Usage Examples

### Using Postman

1. **Import Swagger/OpenAPI**:
   - Go to Postman → Import
   - Choose "Link" tab
   - Enter: `http://localhost:8081/api/swagger.json`
   - Postman will auto-generate all requests

2. **Set Bearer Token**:
   - Get token from login response
   - Go to Authorization tab
   - Select "Bearer Token"
   - Paste your JWT token

3. **Test Endpoints**:
   - All requests are pre-populated
   - Just fill in any path parameters
   - Click "Send"

### Using cURL

```bash
# Public endpoint - no auth needed
curl -X POST http://localhost:8081/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'

# Protected endpoint - with Bearer token
curl -X GET http://localhost:8081/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Frontend (TypeScript/Dart)

Frontend teams can auto-generate TypeScript/Dart interfaces from the OpenAPI spec:

**Tools:**

- [openapi-generator](https://openapi-generator.tech/) - Generate client libraries
- [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api) - TypeScript API client
- [swagger-dart](https://pub.dev/packages/swagger) - Dart models

Example with `swagger-typescript-api`:

```bash
npm install -D swagger-typescript-api

npx swagger-typescript-api -p http://localhost:8081/api/swagger.json -o ./src/types
```

---

## 📦 Files Modified/Created

### Created Files

- ✅ `services/auth-service/docs/swagger.yaml` - Comprehensive OpenAPI specification
- ✅ `services/auth-service/docs/API_DOCUMENTATION.md` - This documentation file

### Modified Files

- ✅ `services/auth-service/src/app.ts` - Added Swagger UI setup
- ✅ `services/auth-service/package.json` - Added dependencies
- ✅ `api-gateway/src/index.js` - Added Swagger consolidation and UI
- ✅ `api-gateway/package.json` - Added dependencies

### Dependencies Added

- `swagger-ui-express` - Express middleware for Swagger UI
- `yaml` - YAML parser for OpenAPI specs
- `@types/swagger-ui-express` - TypeScript types (auth-service only)

---

## 🚀 How to Run

### Start Services Individually

**Auth Service with Swagger UI:**

```bash
cd services/auth-service
npm install
npm run dev

# Swagger UI available at:
# http://localhost:3001/docs
```

**API Gateway with Consolidated Swagger:**

```bash
cd api-gateway
npm install
npm run dev

# Swagger UI available at:
# http://localhost:8081/docs
# OpenAPI JSON: http://localhost:8081/api/swagger.json
# OpenAPI YAML: http://localhost:8081/api/swagger.yaml
```

### Full Stack with Docker

```bash
# From project root
docker compose up --build -d

# Access:
# Gateway Swagger UI: http://localhost:8081/docs
# Auth Service Swagger UI: http://localhost:3001/docs (internal)
```

---

## 📊 Schema Components

### User Object

```typescript
{
  id: string (UUID)
  email: string
  fullName: string
  role: "USER" | "ADMIN" | "SUPER_ADMIN"
  emailVerified: boolean
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

### UserProfile Object

```typescript
{
  bio?: string (max 2000 chars)
  avatarUrl?: string (URI)
  educationalLevel?: string (max 100 chars)
  learningGoals?: string
}
```

### UserWithProfile Object

```typescript
User &
  {
    profile: UserProfile,
  };
```

---

## 🔄 Future Enhancements

1. **Add more services** - As you build user-service, content-service, etc., their Swagger specs will be automatically merged into the gateway
2. **API versioning** - Support multiple API versions (v1, v2, etc.)
3. **OpenAPI extensions** - Add x-examples for more detailed use cases
4. **Mock server** - Use Swagger codegen to generate mock APIs
5. **API monitoring** - Track API usage and performance metrics
6. **SDK generation** - Auto-generate client libraries for different languages

---

## ✅ Checklist

- [x] 7 endpoints fully documented in Swagger
- [x] Request/response schemas with examples
- [x] Error responses (400, 401, 403, 404, 500)
- [x] Security definitions (Bearer JWT)
- [x] Public vs protected routes clearly marked
- [x] Admin-only endpoints documented with role requirements
- [x] Swagger UI at service level (`/docs`)
- [x] Gateway-level consolidation
- [x] OpenAPI spec in multiple formats (JSON, YAML)
- [x] TypeScript types support

---

## 📞 Support

For issues or questions:

1. Check the swagger.yaml file at `services/auth-service/docs/swagger.yaml`
2. View interactive documentation at http://localhost:8081/docs
3. Review controller implementations at `services/auth-service/src/modules/`

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
