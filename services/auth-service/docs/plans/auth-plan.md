# Auth Service - Phân Tích & Kế Hoạch Triển Khai

## 1. Phân Tích Thiết Kế Auth Service

### Thông Số Cơ Bản

- **Tên Service:** auth-service
- **Domain/Port:** api/auth
- **Tech Stack:** Node.js + Express
- **Trách Nhiệm:** Xác thực, phân quyền, JWT, OAuth2, 2FA, quản lý session

---

### Thiết Kế Cấu Trúc Token & Phiên Đăng Nhập

| Token             | Mô tả                                                         |
| ----------------- | ------------------------------------------------------------- |
| **Access Token**  | JWT RS256, 15 phút. Payload: userId, role, orgId, permissions |
| **Refresh Token** | Opaque token, HttpOnly Secure Cookie, 30 ngày                 |

- **Token Rotation:** Cấp token mới và vô hiệu hóa token cũ ngay lập tức khi refresh
- **Revocation:** Redis blacklist cho logout và thu hồi khẩn cấp

---

### Thiết Kế Database & Model

**Bảng `users` (PostgreSQL):**

- `id` (UUID), `email` (unique), `phone_hash`, `password_hash`, `role`, `status`, `subscription_id`, `org_id`, `created_at`, `updated_at`, `deleted_at`

**Bảng `UserSessions`:**

- `id`, `user_id`, `device_info`, `ip`, `created_at`, `expires_at`

**Mã Hóa Mật Khẩu:** bcrypt cost ≥ 12 hoặc Argon2

---

### Bảo Mật & Phân Quyền (RBAC)

- **Roles:** STUDENT, TEACHER, ORG_ADMIN, CONTENT_CREATOR, SUPER_ADMIN
- **Rate Limiting:** 100 request/phút/IP, khóa tạm thời sau 5 lần đăng nhập sai
- **Giao Tiếp:** HTTPS/TLS 1.3 bắt buộc

---

## 2. Yêu Cầu Chức Năng (Features)

| Code      | Mô tả                                                                 | Mức độ   |
| --------- | --------------------------------------------------------------------- | -------- |
| F-AUTH-01 | Đăng ký qua email, SĐT, hoặc mạng xã hội (Google, Facebook, Apple ID) | Bắt buộc |
| F-AUTH-02 | Đăng nhập email/mật khẩu, OTP SMS, SSO Google/Facebook                | Bắt buộc |
| F-AUTH-03 | Xác minh email/SĐT qua OTP 6 chữ số (TTL 10 phút)                     | Bắt buộc |
| F-AUTH-04 | Đặt lại mật khẩu qua email hoặc OTP SMS                               | Bắt buộc |
| F-AUTH-05 | Đăng nhập hai yếu tố (2FA) Authenticator App hoặc SMS                 | Cao      |
| F-AUTH-06 | Tự động đăng xuất sau 30 ngày không hoạt động                         | Cao      |
| F-AUTH-07 | Quản lý hồ sơ cá nhân (avatar, thông tin học tập, mục tiêu)           | Cao      |

---

## 3. Kế Hoạch Triển Khai Chi Tiết

### Phase 1: Khởi tạo Project & Thiết lập Database (Tuần 1)

- [x] Khởi tạo dự án: Node.js, Express, TypeScript, ESLint, Prettier
- [x] Cấu hình Database: Prisma/TypeORM → PostgreSQL 15+
- [x] Tạo Schema: bảng `users` và `UserSessions`
- [x] Thiết lập Cache: Redis 7+ cho session và rate limiting
- [x] Cấu hình Logging: Winston/Pino (JSON format), tích hợp ELK Stack

### Phase 2: Xây Dựng Core Authentication (Tuần 1-2)

- [x] Mã hóa: bcrypt/Argon2 utility functions
- [x] Cấu hình JWT: RS256 access token (15 phút), Opaque refresh token
- [x] `POST /auth/register`: đăng ký + validation
- [x] `POST /auth/login`: trả về access_token + HttpOnly cookie
- [x] `POST /auth/refresh`: Token Rotation + Revocation
- [x] `POST /auth/logout`: revoke refresh token + blacklist access token

### Phase 3: Phân Quyền & OTP/Email (Tuần 2)

- [x] Middleware: `validateToken`, `checkPermission` (RBAC)
- [ ] Tích hợp AWS SES (Email) và Twilio (SMS)
- [x] Logic OTP: sinh mã 6 chữ số, lưu Redis với TTL 10 phút
- [ ] `GET /users/me`: lấy thông tin profile
- [ ] API cập nhật profile cơ bản

### Phase 4: SSO, 2FA & Bảo Mật Nâng Cao (Tuần 3)

- [ ] OAuth2/SSO: Passport.js (Google, Facebook, Apple ID)
- [ ] 2FA: mã QR (Authenticator App) hoặc SMS OTP
- [ ] Rate Limiting: express-rate-limit 100 req/phút/IP
- [ ] Lockout: Redis tạm khóa sau 5 lần sai mật khẩu

### Phase 5: Testing & Observability (Tuần 4)

- [ ] Unit/Integration Test: Jest (coverage ≥ 80%), Supertest
- [ ] Tracing: OpenTelemetry SDK → Jaeger
- [ ] Health Check: `/health`, `/ready` cho Kubernetes
- [ ] Tài liệu: Swagger/OpenAPI 3.0

---

## 4. Dependencies Dự Kiến

```json
{
  "express": "^5.x",
  "pg": "^8.x",
  "ioredis": "^5.x",
  "kafkajs": "^2.x",
  "@supabase/supabase-js": "^2.x",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "passport": "^0.7.x",
  "winston": "^3.x",
  "express-rate-limit": "^7.x",
  "@prisma/client": "^5.x",
  "jest": "^29.x",
  "supertest": "^6.x",
  "@opentelemetry/sdk-node": "^0.x",
  "twilio": "^5.x",
  "nodemailer": "^6.x"
}
```
