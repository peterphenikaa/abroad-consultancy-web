# Phase 3 Setup & Database

- [x] Đọc phase-plan & codebase, hiểu dependencies
- [x] Tạo Prisma migration: Thêm cột email_verified, email_verified_at, phone_verified vào bảng User ([DB-1], [DB-4])
- [x] Sửa lỗi kết nối .env (P1013) và Drift Data bằng prisma migrate reset
- [x] [DB-2], [DB-5]: Thêm bảng UserProfile vào Schema (1-1 với User)
- [x] [DB-3]: Thêm indexes cho user_profiles
- [x] [DB-6]: Chạy npx prisma migrate dev --name create_user_profiles để áp dụng
- [x] [DB-7], [DB-8]: Cập nhật prisma/seed.ts (test users có/không verify email) & chạy seed

🔴 CRITICAL PATH: OTP System (Days 1-3)

- [x] [OTP-1]: Tạo src/constants/otpTypes.ts (định nghĩa các loại OTP)
- [x] [OTP-2]: Tạo src/utils/otpGenerator.ts (logic tạo mã OTP random, check format)
- [x] [OTP-3]: Tạo src/services/otpService.ts (lưu Redis, validate, giới hạn rate limit 5 lần/5 phút)
- [x] [OTP-4]: Viết unit test cho OTP

🟡 EMAIL INTEGRATION (Days 3-4)

- [ ] [EMAIL-1]: Thiết lập src/services/emailService.ts với Nodemailer (SMTP wrapper)
- [ ] [EMAIL-2]: Tạo template otpTemplate.html
- [ ] [EMAIL-3]: Tạo template passwordResetTemplate.html
- [ ] [EMAIL-4]: Tạo template welcomeTemplate.html
- [ ] [EMAIL-6]: Cấu hình biến môi trường SMTP trong .env

🟢 EMAIL VERIFICATION ENDPOINTS (Days 5-6)

- [ ] [AUTH-1]: Sửa endpoint Đăng ký (POST /auth/register): Gửi OTP, set email_verified = false
- [ ] [AUTH-2]: Tạo endpoint POST /auth/verify-email: Nhận OTP, check Redis, set email_verified = true
- [ ] [AUTH-3]: Tạo middleware checkEmailVerified.ts
- [ ] [AUTH-4]: Viết integration test luồng verify email

🔵 PASSWORD RESET FLOW (Days 6-7)

- [ ] [RESET-1]: POST /auth/forgot-password (Tạo & gửi OTP)
- [ ] [RESET-2]: POST /auth/reset-password/verify-otp (Nhận OTP, trả về JWT 5 phút)
- [ ] [RESET-3]: POST /auth/reset-password (Đổi pass, revoke mọi session cũ)
- [ ] [RESET-4]: Viết integration test

🟣 PROFILE ENDPOINTS (Days 7-8)

- [ ] [PROFILE-1]: GET /api/users/me (Lấy data user + profile của chính mình)
- [ ] [PROFILE-2]: PATCH /api/users/me (Cập nhật bio, avatar)
- [ ] [PROFILE-3]: GET /api/users/:userId (Chỉ Admin)
- [ ] [PROFILE-4]: Viết integration test

📝 TESTING, DOCS & FINAL VALIDATION (Days 8-10)

- [ ] [TEST]: Hoàn thiện toàn bộ Test coverage (Unit & E2E)
- [ ] [DOC-1]: Cập nhật Swagger/OpenAPI cho 7 endpoints mới
- [ ] [FINAL]: Test tay toàn bộ luồng (Đăng ký -> OTP -> Verify -> Đăng nhập -> Sửa profile)
