# Phase 4: SSO, 2FA & Bảo Mật Nâng Cao

## 📋 Tổng Quan

Kế hoạch chi tiết thực hiện SSO (OAuth2 Google), 2FA Authenticator App, Rate Limiting, Account Lockout, và CSRF Protection.

---

## 1️⃣ Section 1: OAuth2 Google SSO (Passport.js)

### Dependencies

- `passport` (^0.7.x) - core framework
- `passport-google-oauth20` (^2.x) - Google strategy
- `@types/passport-google-oauth20` (^2.x) - TypeScript types

### Tasks

- [x] **1.0** Cập nhật Prisma Schema cho SSO: Chuyển password_hash thành String? (optional), thêm trường auth_provider (Enum: LOCAL, GOOGLE) và provider_id (String?) → `prisma/schema.prisma`
- [x] **1.1** Setup Google OAuth App credentials (Google Cloud Console) → `.env`
- [x] **1.2** Tạo GoogleStrategy config trong Passport → `src/config/passport.ts` (new)
- [x] **1.3** Implement POST /auth/google/callback endpoint → `src/routes/auth.routes.ts`
- [x] **1.4** Xử lý Account Linking: Tìm user theo email. Nếu chưa có → Tạo mới. Nếu đã có bằng mật khẩu (LOCAL) → Liên kết tài khoản (Update provider_id và auth_provider = GOOGLE) → `src/services/auth.service.ts`
- [x] **1.5** Generate JWT + HttpOnly cookie cho Google login → `src/middleware/auth.middleware.ts`
- [ ] **1.6** Test flow: redirect /auth/google → Google → callback → JWT (Postman/manual)

### Endpoints Mới

- `GET /auth/google` - initiate Google OAuth
- `GET /auth/google/callback` - Google redirect back
- `GET /auth/google/logout` - disconnect Google account

---

## 2️⃣ Section 2: 2FA Authenticator App (QR Code)

### Dependencies

- `speakeasy` (^2.x) - TOTP generation
- `qrcode` (^1.x) - QR code generation

### Tasks

- [ ] **2.1** Extend User model: totp_secret, totp_enabled, backup_codes → `prisma/schema.prisma`
- [ ] **2.2** POST /auth/2fa/setup - generate secret + QR code → `src/services/totp.service.ts` (new)
- [ ] **2.3** POST /auth/2fa/verify - verify TOTP code + enable 2FA → `src/services/totp.service.ts`
- [ ] **2.4** POST /auth/2fa/disable - disable 2FA (require current TOTP) → `src/services/totp.service.ts`
- [ ] **2.5** Modify login flow: Nếu đăng nhập đúng nhưng 2FA enabled → Không trả về Access Token thật, chỉ trả về temporary_token (JWT ngắn hạn 5 phút có chứa userId và is_2fa_pending: true) → `src/services/auth.service.ts`
- [ ] **2.6** Generate backup codes (6 codes, one-time use, store hashed) → `src/services/totp.service.ts`
- [ ] **2.7** Test: setup QR code → scan Authenticator app → verify TOTP (Manual/Jest)

### Flow Diagram

**User Enable 2FA:**

1. `GET /auth/2fa/setup` → return QR code (secret)
2. User scans QR, enters code
3. `POST /auth/2fa/verify` + TOTP code → enable + return backup codes

**User Login với 2FA Enabled:**

4. `POST /auth/login` (email/password) → success → Trả về temporary_token (JWT ngắn hạn 5 phút có chứa userId và is_2fa_pending: true)
5. `POST /auth/verify-totp` (Gửi kèm temporary_token + mã TOTP 6 số) → success → Trả về Access Token & Refresh Token chính thức

---

## 3️⃣ Section 3: Rate Limiting & Account Lockout

### Dependencies

- `express-rate-limit` (^7.x) - rate limiting middleware
- `rate-limit-redis` (^4.x) - Redis store plugin cho express-rate-limit

### Tasks

- [ ] **3.1** Setup RedisStore cho rate-limit → `src/middleware/rateLimiter.ts` (new)
- [ ] **3.2** Apply rate limit 100 req/min/IP globally → Express middleware stack
- [ ] **3.3** Stricter limit 5 req/min/IP cho /auth/login → Custom middleware
- [ ] **3.4** Redis lockout: store failed login count (key: `login_fail:{email}`) → `src/services/lockout.service.ts` (new)
- [ ] **3.4b** Rate limit & Lockout cho 2FA: Thêm strict rate limit (VD: 3-5 lần/15 phút) cho các endpoint /auth/2fa/verify và /auth/verify-totp để chống brute-force mã 6 số → `src/middleware/rateLimiter.ts`
- [ ] **3.5** After 5 failed logins: lock account 15 mins (store in Redis) → `src/services/lockout.service.ts`
- [ ] **3.6** Modify login endpoint: check lockout status trước khi validate password → `src/routes/auth.routes.ts`
- [ ] **3.7** Reset failed count sau login thành công → `src/routes/auth.routes.ts`
- [ ] **3.8** Test: simulate 5 failed logins → verify account locked (Jest + Redis mock)

### Redis Keys Schema

- `login_fail:{email}` → TTL 15 mins, increment on fail, delete on success
- `account_locked:{email}` → TTL 15 mins, set after 5 fails
- `totp_fail:{userId}` → TTL 15 mins, increment on fail. Block nếu > 5

---

## 4️⃣ Section 4: CSRF Protection & Security Headers

### Dependencies

- `csrf-sync` (^4.x) - modern CSRF protection module
- `helmet` (if not already used)

### Tasks

- [ ] **4.1** Verify CORS config (allow credentials, specific origins) → `src/config/cors.ts`
- [ ] **4.2** Add CSRF token middleware (optional nhưng recommended) → `src/middleware/csrf.ts`
- [ ] **4.3** Review JWT anti-CSRF: HttpOnly cookie (good) + SameSite=Strict → Express middleware
- [ ] **4.4** Verify HSTS, X-Frame-Options headers đã set → `src/middleware/security.ts`

---

## 5️⃣ Section 5: Testing & Integration

### Manual Testing Checklist

- [ ] Google OAuth: full login flow (redirect → callback → JWT)
- [ ] 2FA setup: QR scan → TOTP verify → backup codes
- [ ] 2FA login: normal login + TOTP verify + JWT
- [ ] Rate limit: 100 req/min works, 101st returns 429
- [ ] Account lockout: 5 failed attempts → locked, 6th returns locked error
- [ ] Lockout timeout: wait 15 mins → can try again

### Automated Tests (Jest + Supertest)

- [ ] `tests/auth.oauth.test.ts` - Google callback, user creation/existing user
- [ ] `tests/auth.2fa.test.ts` - setup, verify, disable, backup codes
- [ ] `tests/auth.lockout.test.ts` - failed attempts, lockout trigger, timeout
- [ ] `tests/auth.rateLimit.test.ts` - global limit, stricter login limit

---

## 📝 Detailed Task Breakdown - File-by-File

### New Files to Create

| #   | File                              | Purpose                                     |
| --- | --------------------------------- | ------------------------------------------- |
| 1   | `src/config/passport.ts`          | Passport.js + Google Strategy               |
| 2   | `src/services/totp.service.ts`    | TOTP generation, verification, backup codes |
| 3   | `src/services/lockout.service.ts` | Account lockout logic                       |
| 4   | `src/middleware/rateLimiter.ts`   | Rate limiting middleware                    |
| 5   | `src/middleware/csrf.ts`          | CSRF protection (optional)                  |
| 6   | `tests/auth.oauth.test.ts`        | Google OAuth tests                          |
| 7   | `tests/auth.2fa.test.ts`          | 2FA tests                                   |
| 8   | `tests/auth.lockout.test.ts`      | Lockout tests                               |

### Files to Modify

| #   | File                           | Changes                                                                                                                        |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 9   | `prisma/schema.prisma`         | Add 2FA fields (totp_secret, totp_enabled, backup_codes), SSO fields (auth_provider, provider_id), make password_hash optional |
| 10  | `src/routes/auth.routes.ts`    | Add new OAuth/2FA/lockout endpoints                                                                                            |
| 11  | `src/services/auth.service.ts` | Update login flow for 2FA + lockout, temporary_token generation                                                                |
| 12  | `.env.example`                 | Add Google OAuth credentials                                                                                                   |
| 13  | `package.json`                 | Add new dependencies                                                                                                           |

---

## ⏱️ Estimated Timeline

| Section                          | Duration         |
| -------------------------------- | ---------------- |
| Section 1 (Google OAuth)         | 2-3 hours        |
| Section 2 (2FA)                  | 3-4 hours        |
| Section 3 (Rate Limit + Lockout) | 2-3 hours        |
| Section 4 (Security)             | 1-2 hours        |
| Section 5 (Testing)              | 2-3 hours        |
| **Total**                        | **~12-15 hours** |

---

## 📊 Progress Tracking

Use this section to track which sections have been completed:

- [ ] Section 1: OAuth2 Google SSO
- [ ] Section 2: 2FA Authenticator App
- [ ] Section 3: Rate Limiting & Account Lockout
- [ ] Section 4: CSRF Protection & Security Headers
- [ ] Section 5: Testing & Integration
