# Quick Reference Guide - Swagger/OpenAPI Documentation

## 🎯 Quick Access Points

### For Developers

- **Interactive Docs**: http://localhost:8081/docs
- **OpenAPI JSON**: http://localhost:8081/api/swagger.json
- **OpenAPI YAML**: http://localhost:8081/api/swagger.yaml

### For QA/Testers

- **Postman Import**: Use link import with `http://localhost:8081/api/swagger.json`
- **Direct Testing**: Open http://localhost:8081/docs and use "Try it out" button

### For Frontend/Mobile Team

- **Auto-generate TypeScript**: `npx swagger-typescript-api -p http://localhost:8081/api/swagger.json`
- **Auto-generate Dart**: Use [swagger-dart](https://pub.dev/packages/swagger)

---

## 📋 The 7 Documented Endpoints

### Group 1: Email & Password (Public - No Auth)

```
1. POST /api/auth/verify-email
   └─ Body: {email, otp}
   └─ Response: {success, message, user}

2. POST /api/auth/forgot-password
   └─ Body: {email}
   └─ Response: {success, message}

3. POST /api/auth/reset-password/verify-otp
   └─ Body: {email, otp}
   └─ Response: {success, message, resetToken}

4. POST /api/auth/reset-password
   └─ Body: {token, newPassword}
   └─ Response: {success, message}
```

### Group 2: Profile Management (Protected - Bearer Token)

```
5. GET /api/users/me
   └─ Header: Authorization: Bearer <token>
   └─ Response: {success, data: {user + profile}}

6. PATCH /api/users/me
   └─ Header: Authorization: Bearer <token>
   └─ Body: {fullName?, bio?, avatarUrl?, educationalLevel?, learningGoals?}
   └─ Response: {message, data: {updated user}}

7. GET /api/users/{userId}
   └─ Header: Authorization: Bearer <token> (SUPER_ADMIN only)
   └─ Path Param: userId
   └─ Response: {success, data: {target user}}
```

---

## 🔑 Authentication Pattern

### Getting a Token

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Using the Token

```bash
curl -X GET http://localhost:8081/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## ✅ Common Use Cases

### Use Case 1: User Registration Flow

```
1. Frontend calls: POST /api/auth/register
   └─ User gets OTP via email
2. Frontend calls: POST /api/auth/verify-email {email, otp}
   └─ Email verified ✓
3. Frontend calls: POST /api/auth/login {email, password}
   └─ User gets access_token
4. Frontend calls: GET /api/users/me (with token)
   └─ User profile loaded
```

### Use Case 2: Password Reset Flow

```
1. Frontend calls: POST /api/auth/forgot-password {email}
   └─ User gets OTP via email
2. Frontend calls: POST /api/auth/reset-password/verify-otp {email, otp}
   └─ Response includes resetToken
3. Frontend calls: POST /api/auth/reset-password {token, newPassword}
   └─ Password changed ✓
4. Frontend calls: POST /api/auth/login (with new password)
   └─ User logs in with new password
```

### Use Case 3: Update User Profile

```
1. Frontend calls: GET /api/users/me (with token)
   └─ Current profile loaded
2. User edits profile fields
3. Frontend calls: PATCH /api/users/me (with token)
   └─ Profile updated ✓
```

### Use Case 4: Admin Views User Profile

```
1. Admin calls: GET /api/users/{userId} (with SUPER_ADMIN token)
   └─ Can view any user's profile
2. Regular user tries same call
   └─ Returns 403 Forbidden ✗
```

---

## 🚨 Common Error Codes

| Code             | Status | Meaning                  | Fix                                   |
| ---------------- | ------ | ------------------------ | ------------------------------------- |
| VALIDATION_ERROR | 400    | Invalid input format     | Check request body format             |
| UNAUTHORIZED     | 401    | Missing or expired token | Get new token from login              |
| FORBIDDEN        | 403    | User lacks permissions   | Use admin account for admin endpoints |
| NOT_FOUND        | 404    | Resource doesn't exist   | Check userId or email                 |
| INTERNAL_ERROR   | 500    | Server error             | Try again or contact support          |

---

## 📱 For Mobile Developers

### Auto-generate Models from Swagger

**iOS (Swift):**

```bash
brew install swagger-codegen
swagger-codegen generate -i http://localhost:8081/api/swagger.json -l swift5 -o ./iOS
```

**Android (Kotlin):**

```bash
swagger-codegen generate -i http://localhost:8081/api/swagger.json -l kotlin -o ./android
```

**Flutter/Dart:**

```bash
pub global activate swagger_dart_code_generator
swagger-dart generate -i http://localhost:8081/api/swagger.json
```

---

## 💾 Files to Know

| File           | Location                                          | Purpose                          |
| -------------- | ------------------------------------------------- | -------------------------------- |
| Swagger Spec   | `services/auth-service/docs/swagger.yaml`         | Source of truth for API contract |
| Full Docs      | `services/auth-service/docs/API_DOCUMENTATION.md` | Detailed documentation           |
| Gateway Setup  | `api-gateway/src/index.js`                        | Consolidates and serves docs     |
| Implementation | `services/auth-service/src/modules/`              | Actual API implementations       |

---

## 🔗 Integration Links

- **Postman Collection**: Import from `http://localhost:8081/api/swagger.json`
- **GitHub**: Link swagger.yaml in repo for developers
- **API Portal**: Host swagger.yaml + UI on docs portal
- **SDK Generation**: Use openapi-generator for client libraries
- **Testing**: Use swagger.yaml with Newman for automated tests

---

## ⚡ Quick Postman Setup

1. Open Postman
2. Click **Import** → **Link**
3. Paste: `http://localhost:8081/api/swagger.json`
4. Collection is created with all 7 endpoints
5. For auth endpoints: Get token from login, copy to Bearer field
6. Click **Send** on any endpoint to test

---

## 🎓 Learning Path

For new team members:

1. Read this quick reference (5 min)
2. Open Swagger UI at http://localhost:8081/docs (5 min)
3. Import in Postman and test 2-3 endpoints (10 min)
4. Read full documentation in `API_DOCUMENTATION.md` (15 min)
5. Check actual implementation in controllers (20 min)

**Total onboarding time: ~55 minutes**

---

**Version:** 1.0.0  
**Last Updated:** January 2024
