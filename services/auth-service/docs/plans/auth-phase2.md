# Phase 2 Goal

- Hoàn thành core auth:
  - password hashing
  - RS256 access token (15m)
  - opaque refresh token (30d, HttpOnly cookie)
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh với rotation + revocation

## Step-by-step (recommended order)

### 1. Chốt integration contract với gateway (blocker trước khi code)

- Gateway hiện verify JWT bằng JWT_SECRET (HS) nhưng plan của bạn là RS256.
- Chốt 1 trong 2:
  - A) Gateway chuyển sang verify RS256 bằng JWT_PUBLIC_KEY (recommended).
  - B) Tạm HS256 cho phase 2 (không đúng plan dài hạn).
- Add /api/auth/refresh vào public routes của gateway (không cần access token để refresh).

### 2. Chuẩn hóa env cho Phase 2

- Trong auth-service thêm:
  - JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, JWT_KID
  - ACCESS_TOKEN_TTL=15m
  - REFRESH_TOKEN_TTL_DAYS=30
  - BCRYPT_ROUNDS=12
  - COOKIE_DOMAIN (optional), COOKIE_SECURE
- Update src/config/env.ts để validate các biến mới.

### 3. Thiết kế token/session model cho rotation

- Giữ users, user_sessions; thêm migration cho user_sessions:
  - refresh_token_hash (nullable -> non-null when login)
  - revoked_at (nullable)
  - last_used_at (nullable)
- Mục tiêu: mỗi refresh phải invalidate token cũ và cấp token mới.

### 4. Tạo crypto/token utilities

- Tạo lib:
  - hashPassword, verifyPassword (bcrypt)
  - signAccessTokenRS256(payload) + verifyAccessToken
  - generateOpaqueRefreshToken() (random 32+ bytes)
  - hashRefreshToken(token) (sha256)
- Không lưu refresh token raw, chỉ lưu hash.

### 5. Implement session service

- src/modules/session/session.service.ts:
  - createSession(userId, deviceInfo, ip, refreshTokenHash, expiresAt)
  - rotateSessionRefreshToken(sessionId, newHash, now)
  - revokeSession(sessionId, reason?)
  - findValidSessionByRefreshTokenHash(hash)
- Redis key convention:
  - auth:refresh:blacklist:<hash> (TTL còn lại của token cũ)
  - auth:session:<sessionId>

### 6. Register API (POST /auth/register)

- Validate input (zod): email, password (min length + complexity baseline).
- Flow:
  - check email unique
  - hash password
  - create user default role/status
  - trả user basic info (không trả password hash)
- Chưa cần OTP verification trong phase 2 (để phase 3).

### 7. Login API (POST /auth/login)

- Validate input.
- Flow:
  - find user by email
  - verify password
  - check status (ACTIVE)
  - generate access token (15m)
  - generate opaque refresh token
  - create session + save refresh hash
  - set cookie refresh_token (HttpOnly, Secure in prod, SameSite phù hợp)
  - return JSON: access_token, token_type, expires_in, user summary

### 8. Refresh API (POST /auth/refresh)

- Input từ cookie refresh_token.
- Flow:
  - hash token, lookup session
  - reject nếu revoked/expired/blacklisted
  - generate new refresh token + new access token
  - rotate: update DB hash + blacklist old hash (Redis TTL)
  - set new cookie, return new access token
- Đây là chỗ quan trọng nhất của phase 2.

### 9. Logout API (POST /auth/logout)

- Flow:
  - hash token, lookup session
  - revoke session (set revoked_at)
  - blacklist refresh token hash (Redis)
  - clear cookie

### 9. Wire route/controller/service

- auth.route.ts: mount /register, /login, /refresh
- auth.controller.ts: parse request/response only
- auth.service.ts: business logic chính
- Mount auth router trong src/app.ts tại /auth.

### 10. Error contract thống nhất

- Chuẩn response:
  - 400 validation
  - 401 invalid credentials/token
  - 403 revoked/blocked
  - 409 email existed
- Không leak lý do chi tiết cho login fail (tránh user enumeration).

### 11. Smoke test checklist

- register với email mới -> 201
- register email trùng -> 409
- login đúng -> có access_token + Set-Cookie
- login sai password -> 401
- refresh cookie hợp lệ -> token mới + cookie mới
- refresh dùng lại old refresh token -> bị reject (rotation working)

### 12. Definition of Done cho Phase 2

- 3 endpoint chạy end-to-end qua gateway.
- Access token verify OK ở gateway (đúng algorithm đã chốt).
- Refresh token rotation + revocation hoạt động thật.
- Không lưu raw refresh token.
- Build/lint pass và docker boot thành công.

---
