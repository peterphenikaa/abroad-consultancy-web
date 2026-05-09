# Phase 3: Kế Hoạch Chi Tiết Từng Bước

**Thời lượng:** 2 tuần | **Trọng tâm:** Phân quyền, OTP, Xác thực email, Quản lý hồ sơ

## Tổng Quan

Phase 3 xây dựng dựa trên nền tảng xác thực vững chắc (Phase 2) bằng cách bổ sung:

1. Middleware kiểm soát truy cập dựa trên vai trò (RBAC)
2. Hệ thống quyền hạn
3. Logic tạo và xác minh OTP
4. Luồng xác thực email
5. Các endpoint hồ sơ cá nhân

---

## Bước 1: Middleware & Hệ Thống RBAC (Ngày 1-2)

**Mục tiêu:** Triển khai middleware xác thực token và kiểm tra quyền hạn

### 1.1 Tạo Middleware validateToken

- **File:** `src/middleware/validateToken.ts`
- **Trách nhiệm:**
  - Trích xuất JWT từ header Authorization
  - Xác minh chữ ký bằng public key
  - Kiểm tra hết hạn token
  - Xác thực token không có trong danh sách đen Redis
  - Gắn payload người dùng vào `req.user`
  - Trả về 401 nếu bất kỳ kiểm tra nào thất bại
- **Xử lý lỗi:** 401 Unauthorized với phản hồi lỗi chuẩn

### 1.2 Tạo Middleware checkPermission

- **File:** `src/middleware/checkPermission.ts`
- **Trách nhiệm:**
  - Kiểm tra vai trò của người dùng so với các vai trò bắt buộc (tham số)
  - Kiểm tra quyền hạn cụ thể so với payload người dùng
  - Hỗ trợ phân cấp vai trò (ví dụ: SUPER_ADMIN > ORG_ADMIN > TEACHER > STUDENT)
  - Trả về 403 Forbidden nếu quyền hạn không đủ
- **Mẫu sử dụng:** `router.get('/endpoint', validateToken, checkPermission(['TEACHER', 'SUPER_ADMIN']), controller)`

### 1.3 Tạo File Hằng số RBAC

- **File:** `src/constants/roles.ts`
- **Nội dung:**
  - Định nghĩa 5 vai trò: STUDENT, TEACHER, ORG_ADMIN, CONTENT_CREATOR, SUPER_ADMIN
  - Định nghĩa ánh xạ phân cấp vai trò/quyền hạn
  - Ví dụ: `ROLE_PERMISSIONS = { SUPER_ADMIN: ['*'], TEACHER: ['grade', 'view_students'] }`

### 1.4 Cập nhật Lược Đồ Cơ Sở Dữ Liệu Người Dùng

- **Migration:** Thêm cột enum vai trò (đã tồn tại nhưng cần xác minh mặc định là STUDENT)
- **Mô hình Prisma:** Thêm trường role với kiểu enum
- **Dữ liệu Seed:** Tạo người dùng thử nghiệm với các vai trò khác nhau

---

## Bước 2: Hệ Thống OTP (Ngày 2-3)

**Mục tiêu:** Triển khai logic tạo, xác thực và lưu trữ OTP

### 2.1 Tạo Tiện Ích Tạo OTP

- **File:** `src/utils/otpGenerator.ts`
- **Chức năng:**
  - `generateOTP()` → Tạo OTP 6 chữ số
  - `generateOTPWithExpiry()` → OTP + timestamp + TTL (10 phút)
  - `validateOTPFormat()` → Xác thực đầu vào là 6 chữ số
- **Yêu cầu:**
  - Ngẫu nhiên về mặt mã hóa (sử dụng `crypto.randomInt()`)
  - Không có mẫu hoặc chuỗi
  - Được đệm không ở bên trái thành 6 chữ số

### 2.2 Tạo Lưu Trữ OTP & Truy Xuất

- **File:** `src/services/otpService.ts`
- **Khóa Redis:** `otp:${identifier}:${type}` (ví dụ: `otp:user@example.com:email_verify`)
- **Chức năng:**
  - `saveOTP(identifier, type, otp, ttl)` → Lưu trong Redis với TTL 10 phút
  - `validateOTP(identifier, type, userProvidedOtp)` → Xác minh và xóa khi thành công
  - `deleteOTP(identifier, type)` → Dọn dẹp thủ công
  - `getOTPAttempts(identifier)` → Theo dõi lần thử thất bại
  - Ngăn chặn giới hạn tốc độ: Tối đa 5 lần thử OTP mỗi identifier trong 5 phút
- **Xử lý lỗi:**
  - "OTP expired" nếu không tìm thấy
  - "Invalid OTP" nếu không khớp
  - "Too many attempts" nếu > 5 lần thất bại

### 2.3 Loại OTP & Hằng số

- **File:** `src/constants/otpTypes.ts`
- **Loại:**
  - `EMAIL_VERIFY` → Để xác thực email trong quá trình đăng ký
  - `PHONE_VERIFY` → Để xác thực SMS trong quá trình đăng ký
  - `PASSWORD_RESET` → Cho luồng đặt lại mật khẩu
  - `2FA_SMS` → Cho 2FA SMS trong quá trình đăng nhập
- Mỗi loại có thể có TTL khác nhau (mặc định: 10 phút)

---

## Bước 3: Tích Hợp Email (Ngày 3-4)

**Mục tiêu:** Thiết lập dịch vụ email và mẫu email

### 3.1 Thiết Lập Dịch Vụ Email

- **File:** `src/services/emailService.ts`
- **Nhà cung cấp:** **Nodemailer với SMTP** (cấu hình qua `.env`)
  - **Lý do chọn Nodemailer:**
    - ✅ Hoạt động ngay lập tức với bất kỳ SMTP nào (Gmail, Mailtrap, v.v.)
    - ✅ Không cần xác thực domain/email trước (không giống AWS SES)
    - ✅ Lý tưởng cho giai đoạn development
    - ✅ Dễ dàng chuyển sang AWS SES trong production chỉ bằng cách đổi `.env` — code không thay đổi
  - **Cấu hình `.env`:**
    ```
    EMAIL_PROVIDER=nodemailer
    SMTP_HOST=smtp.mailtrap.io (hoặc smtp.gmail.com cho test)
    SMTP_PORT=2525 (hoặc 587 cho Gmail)
    SMTP_USER=your-mailtrap-username
    SMTP_PASS=your-mailtrap-password
    SMTP_FROM=noreply@doanliennganh.edu.vn
    ```
- **Chức năng:**
  - `sendOTPEmail(email, otp, type)` → Gửi OTP để xác minh
  - `sendPasswordResetEmail(email, resetLink)` → Để đặt lại mật khẩu
  - `sendWelcomeEmail(email, name)` → Chào mừng người dùng mới
  - `sendRoleChangeEmail(email, newRole)` → Thông báo thay đổi vai trò
- **Xử lý lỗi:** Ghi lại lỗi, logic thử lại với backoff hàm mũ
- **Tương lai:** Tạo abstraction layer để dễ dàng chuyển sang AWS SES/SendGrid khi cần scale

### 3.2 Mẫu Email

- **Thư mục:** `src/templates/emails/`
- **Mẫu:**
  - `otpTemplate.html` → Email OTP với branding
  - `passwordResetTemplate.html` → Link đặt lại & hướng dẫn
  - `welcomeTemplate.html` → Thông điệp chào mừng
  - Sử dụng biến mẫu: `{{otp}}`, `{{expiresIn}}`, `{{userName}}`

### 3.3 Hàng Đợi Gửi Email (Tùy chọn nhưng được Khuyên dùng)

- **File:** `src/services/emailQueue.ts`
- Sử dụng Kafka hoặc mẫu hàng đợi đơn giản để ngăn chặn chặn
- Ghi lại trạng thái công việc email vào cơ sở dữ liệu/Redis cho logic thử lại

---

## Bước 4: Endpoint Xác Thực Email (Ngày 4-5)

**Mục tiêu:** Tạo endpoint để xác thực email trong luồng đăng ký

### 4.1 Cập Nhật Luồng Đăng Ký

- **Endpoint:** `POST /auth/register` (sửa đổi hiện có)
- **Thay đổi:**
  - Sau khi tạo người dùng thành công, tạo OTP
  - Gửi OTP qua email
  - Đặt `email_verified` của người dùng thành false
  - Trả về 201 với thông điệp: "Kiểm tra email của bạn để lấy mã xác thực"
  - Lưu OTP được tạo trong Redis với TTL 10 phút

### 4.2 Tạo Endpoint Xác Thực Email

- **Endpoint:** `POST /auth/verify-email`
- **Nội dung Yêu cầu:** `{ email: string, otp: string }`
- **Phản hồi:**
  - 200 OK nếu hợp lệ → Đánh dấu `email_verified = true`
  - 400 Bad Request nếu OTP không hợp lệ/hết hạn
  - 429 Too Many Requests nếu > 5 lần thử
- **Tác dụng phụ:**
  - Xóa OTP khỏi Redis khi thành công
  - Tăng bộ đếm lần thử khi thất bại
  - Tùy chọn gửi email "xác thực thành công"

### 4.3 Thêm Kiểm Tra Xác Thực Email

- **Middleware:** `checkEmailVerified`
- **Sử dụng:** Bảo vệ các endpoint nhất định cho đến khi email được xác thực
- **Điểm quyết định:** Đăng nhập có hoạt động với email chưa được xác thực không? (khuyến nghị: có, nhưng đánh dấu nó)

---

## Bước 5: Luồng Đặt Lại Mật Khẩu (Ngày 5-6)

**Mục tiêu:** Triển khai quên mật khẩu → xác minh OTP → đặt lại mật khẩu

### 5.1 Tạo Endpoint Quên Mật Khẩu

- **Endpoint:** `POST /auth/forgot-password`
- **Nội dung Yêu cầu:** `{ email: string }`
- **Phản hồi:** 200 OK (luôn luôn, không rò rỉ nếu email tồn tại)
- **Logic:**
  - Kiểm tra nếu email tồn tại trong cơ sở dữ liệu
  - Nếu có: Tạo OTP, gửi qua email
  - Nếu không: Vẫn trả về 200 (bảo mật: đừng xác nhận sự tồn tại của email)
  - Lưu OTP trong Redis dưới `reset_password:${email}` với TTL 30 phút

### 5.2 Tạo Endpoint Xác Thực Đặt Lại Mật Khẩu

- **Endpoint:** `POST /auth/reset-password/verify-otp`
- **Nội dung Yêu cầu:** `{ email: string, otp: string }`
- **Phản hồi:**
  - 200 OK với token đặt lại tạm thời (ngắn hạn, 5 phút)
  - 400 Bad Request nếu OTP không hợp lệ
  - Token chỉ có thể được sử dụng một lần để đặt lại mật khẩu

### 5.3 Tạo Endpoint Đặt Lại Mật Khẩu

- **Endpoint:** `POST /auth/reset-password`
- **Nội dung Yêu cầu:** `{ resetToken: string, newPassword: string }`
- **Phản hồi:**
  - 200 OK nếu thành công
  - 400 Bad Request nếu token không hợp lệ/hết hạn
- **Logic:**
  - Xác minh token đặt lại
  - Xác thực độ mạnh của mật khẩu mới
  - Hash mật khẩu mới bằng bcrypt
  - Cập nhật mật khẩu người dùng
  - Làm không có hiệu lực tất cả các phiên hiện có (đăng xuất tất cả các thiết bị)
  - Gửi email xác nhận

---

## Bước 6: Các Endpoint Hồ Sơ (Ngày 6-7)

**Mục tiêu:** Tạo các endpoint để truy xuất và cập nhật hồ sơ người dùng

### 6.1 Endpoint Lấy Hồ Sơ Người Dùng

- **Endpoint:** `GET /api/users/me`
- **Middleware:** `validateToken` (được bảo vệ)
- **Phản hồi:** Đối tượng người dùng với:
  - `id`, `email`, `phone_hash` (được che dấu), `role`, `status`
  - `profile_data` (URL avatar, tiểu sử, v.v.)
  - `created_at`, `updated_at`
  - Loại trừ: `password_hash`, dữ liệu nhạy cảm
- **Triển khai:** Sử dụng `req.user.id` từ payload token

### 6.2 Endpoint Cập Nhật Hồ Sơ Cơ Bản

- **Endpoint:** `PATCH /api/users/me`
- **Middleware:** `validateToken`
- **Nội dung Yêu cầu:** `{ bio?: string, avatar_url?: string, phone?: string }`
- **Xác thực:**
  - Tiểu sử: tối đa 500 ký tự
  - URL avatar: định dạng URL hợp lệ
  - Điện thoại: định dạng hợp lệ (nếu được cung cấp)
- **Phản hồi:** Hồ sơ người dùng được cập nhật (200 OK)
- **Bảo mật:** Chỉ người dùng có thể cập nhật hồ sơ của họ

### 6.3 Cập Nhật Các Trường Hồ Sơ (Mở Rộng Tùy chọn)

- **Các trường để hỗ trợ:**
  - Trình độ học vấn (trung học, cử nhân, thạc sĩ, v.v.)
  - Mục tiêu học tập / sở thích học tập
  - Tiến trình/thành tích (được quản lý bởi content-service)
- **Quyết định:** Lưu trữ trong bảng người dùng giống nhau hay bảng user_profiles riêng biệt?
  - Khuyến nghị: Bảng user_profiles riêng biệt để linh hoạt

### 6.4 Endpoint Lấy Người Dùng Theo ID (Chỉ Quản trị viên)

- **Endpoint:** `GET /api/users/:userId`
- **Middleware:** `validateToken`, `checkPermission(['SUPER_ADMIN', 'ORG_ADMIN'])`
- **Phản hồi:** Hồ sơ người dùng đầy đủ (không có mật khẩu)
- **Trường hợp sử dụng:** Bảng điều khiển quản trị viên, quản lý người dùng

---

## Bước 7: Migrations & Mô Hình Cơ Sở Dữ Liệu (Ngày 7)

**Mục tiêu:** Tạo các thay đổi cơ sở dữ liệu để hỗ trợ Phase 3

### 7.1 Tạo Prisma Migrations

- **Migration 1:** Thêm các trường xác thực email vào người dùng
  - `email_verified: boolean` (mặc định: false)
  - `email_verified_at: DateTime?`
  - `phone_verified: boolean` (mặc định: false)
- **Migration 2:** Tạo bảng user_profiles (tùy chọn)
  - `id`, `user_id` (FK đến người dùng)
  - `bio: string?`, `avatar_url: string?`
  - `educational_level: enum?`, `learning_goals: string?`
  - `created_at`, `updated_at`
- **Migration 3:** Thêm chỉ mục để cải thiện hiệu suất
  - Chỉ mục trên `users.email_verified` (để lọc)
  - Chỉ mục trên `user_profiles.user_id`

### 7.2 Cập Nhật Lược Đồ Prisma

```prisma
model User {
  // ... các trường hiện có
  email_verified Boolean @default(false)
  email_verified_at DateTime?
  role Role @default(STUDENT)
  profile UserProfile?
}

model UserProfile {
  id String @id @default(cuid())
  userId String @unique
  user User @relation(fields: [userId], references: [id])
  bio String?
  avatarUrl String?
  educationalLevel String?
  learningGoals String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Bước 8: Kiểm Tra & Xác Thực (Ngày 7-8)

**Mục tiêu:** Viết các bài kiểm tra để đảm bảo các thành phần Phase 3 hoạt động chính xác

### 8.1 Kiểm Tra Đơn Vị

- **File:** `src/middleware/validateToken.test.ts`
  - Token hợp lệ → vượt qua
  - Token không hợp lệ → 401
  - Token hết hạn → 401
  - Token trong danh sách đen → 401
- **File:** `src/middleware/checkPermission.test.ts`
  - Người dùng có vai trò chính xác → vượt qua
  - Người dùng không có vai trò bắt buộc → 403
- **File:** `src/utils/otpGenerator.test.ts`
  - OTP là 6 chữ số
  - OTP được ngẫu nhiên hóa
  - Xác thực định dạng hoạt động
- **File:** `src/services/otpService.test.ts`
  - Lưu và truy xuất OTP
  - OTP hết hạn sau TTL
  - Giới hạn lần thử hoạt động

### 8.2 Kiểm Tra Tích Hợp

- **File:** `src/routes/auth.integration.test.ts`
  - Luồng xác thực email (toàn bộ chu kỳ)
  - Luồng đặt lại mật khẩu (toàn bộ chu kỳ)
  - Xử lý OTP không hợp lệ
- **File:** `src/routes/users.integration.test.ts`
  - Lấy hồ sơ của chính mình (được xác thực)
  - Cập nhật hồ sơ với xác thực
  - Không thể truy cập hồ sơ của người dùng khác

### 8.3 Danh Sách Kiểm Tra Kiểm Tra Thủ Công

- [ ] Đăng ký người dùng → nhận email OTP
- [ ] Xác thực email với OTP chính xác → `email_verified = true`
- [ ] Thử đăng nhập mà không xác thực email → nên hoạt động (với cờ)
- [ ] Quên mật khẩu → nhận OTP
- [ ] Đặt lại mật khẩu với OTP → đăng nhập bằng mật khẩu mới
- [ ] Lấy hồ sơ dưới dạng người dùng được xác thực
- [ ] Cập nhật thông tin hồ sơ
- [ ] Cố gắng truy cập hồ sơ mà không có token → 401
- [ ] Quản trị viên truy cập hồ sơ người dùng khác → 200
- [ ] Không phải quản trị viên truy cập hồ sơ người dùng khác → 403

---

## Bước 9: Tài Liệu & Ghi Nhật Ký (Ngày 8)

**Mục tiêu:** Ghi lại các thay đổi Phase 3 và thêm khả năng quan sát

### 9.1 Cập Nhật Tài Liệu Swagger/OpenAPI

- **Các Endpoint Mới:**
  - `POST /auth/verify-email`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password/verify-otp`
  - `POST /auth/reset-password`
  - `GET /api/users/me`
  - `PATCH /api/users/me`
  - `GET /api/users/:userId`

### 9.2 Thêm Ghi Nhật Ký Có Cấu Trúc

- Ghi lại các nỗ lực tạo/xác thực OTP
- Ghi lại kết quả kiểm tra quyền hạn
- Ghi lại trạng thái gửi email
- Ghi lại cập nhật hồ sơ (dấu vết kiểm tra)

### 9.3 Tạo Sổ Tay

- Xử lý sự cố vấn đề phân phối email
- Gỡ lỗi OTP
- Phục hồi từ các lần đặt lại mật khẩu thất bại
- Vấn đề quyền hạn cho quản trị viên

---

## Lịch Trình Tóm Tắt

| Ngày | Nhiệm vụ |
|------|---------|
| 1-2 | Middleware & RBAC |
| 2-3 | Hệ thống OTP |
| 3-4 | Tích hợp Email |
| 4-5 | Endpoint Xác thực Email |
| 5-6 | Luồng Đặt lại Mật khẩu |
| 6-7 | Các Endpoint Hồ sơ |
| 7 | Migrations & Mô hình Cơ sở Dữ liệu |
| 7-8 | Kiểm tra & Xác thực |
| 8 | Tài liệu & Ghi nhật ký |
| **Tổng cộng** | **~14 ngày (2 tuần)** |

---

---

## Quyết Định Cuối Cùng

Dựa trên yêu cầu & tối ưu hóa dự án, các quyết định sau đã được phê duyệt:

### 1. Nhà Cung Cấp Email: **Nodemailer + SMTP (cấu hình qua .env)**

**Lý do:**
- ✅ AWS SES yêu cầu xác thực domain/email trước — quá phức tạp ở giai đoạn dev
- ✅ Nodemailer hoạt động ngay với SMTP bất kỳ (Gmail, Mailtrap, Sendgrid)
- ✅ Setup đơn giản, không tốn thời gian verify domain
- ✅ Production: Chỉ đổi `.env` sang SES — **code không thay đổi** (abstraction layer)

**Triển khai:**
- Dùng `nodemailer` npm package
- Cấu hình SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS trong `.env`
- Trong `emailService.ts`: Tạo abstraction interface để dễ chuyển sang các provider khác sau

**Dev/Test:** Dùng Mailtrap hoặc Gmail SMTP
**Production (sau):** Chuyển sang AWS SES hoặc SendGrid mà không thay code

---

### 2. Lưu Trữ Hồ Sơ Người Dùng: **Bảng `user_profiles` riêng biệt**

**Quyết định:**
- Tạo bảng `user_profiles` riêng biệt (xem Bước 7.2)
- Liên kết 1-1 với bảng `users`

**Lý do:**
- ✅ Linh hoạt để mở rộng trường sau (learning goals, achievements, social links, v.v.)
- ✅ Tránh "tính béo hóa" bảng `users` (keep users table lean)
- ✅ Dễ backup/migrate user_profiles mà không ảnh hưởng authn data
- ✅ Tối ưu query (users table nhỏ = authn nhanh)

**Các trường ban đầu:**
- `id`, `userId` (FK), `bio`, `avatarUrl`, `educationalLevel`, `learningGoals`, `createdAt`, `updatedAt`

**Tương lai:** Có thể thêm achievements, social_links, preferences mà không đặt bản.

---

### 3. Yêu Cầu Xác Thực Email: **Tùy chọn nhưng được theo dõi**

**Quyết định:**
- ✅ **Email verification KHÔNG bắt buộc để đăng nhập**
- ✅ **Nhưng được theo dõi:** `email_verified` flag trong DB
- ✅ Các endpoint nhạy cảm (thay đổi mật khẩu, xóa tài khoản) CÓ THỂ yêu cầu xác thực

**Luồng:**
1. User đăng ký → Email được gửi + `email_verified = false`
2. User CÓ THỂ đăng nhập ngay (nhưng hệ thống biết email chưa verify)
3. User xác thực email → `email_verified = true`
4. (Tương lai) Endpoints quan trọng yêu cầu `checkEmailVerified` middleware

**Lợi ích:**
- ✅ Không chặn user vội vã (UX tốt)
- ✅ Tracks email verification status (audit)
- ✅ Linh hoạt cho role-based requirements (có thể yêu cầu verify cho TEACHER, không cho STUDENT)

---

### 4. Token Đặt Lại Mật Khẩu: **JWT ngắn hạn (5 phút)**

**Quyết định:**
- ✅ Sử dụng **JWT với TTL = 5 phút**
- ✅ Tạo bằng `jwt.sign()` với **purpose = "password_reset"**
- ✅ Giải mã & xác minh bằng `jwt.verify()` trước khi reset

**Cấu trúc Token:**
```json
{
  "sub": "user-id-here",
  "email": "user@example.com",
  "purpose": "password_reset",
  "iat": 1234567890,
  "exp": 1234567890 + 300  // 5 phút
}
```

**Lý do JWT > Opaque token (Redis):**
- ✅ Không cần query Redis (stateless)
- ✅ Signature xác minh quyền sở hữu token
- ✅ TTL ngắn (5 phút) → an toàn
- ✅ Dễ debug (có thể decode trên jwt.io)

**Xác thực bổ sung:**
- Decode JWT & check `purpose = "password_reset"`
- Check `exp > now()`
- Xóa token sau khi sử dụng (add token vào blacklist Redis)

---

### 5. Sở Thích Thông Báo: **Trì hoãn sang Phase 4**

**Quyết định:**
- ✅ Phase 3 gửi email transactional mà không có cấu hình sở thích
- ✅ Tất cả users nhận đầy đủ emails (OTP, password reset, welcome, v.v.)
- ✅ **Phase 4:** Thêm bảng `user_notification_preferences` + middleware `checkNotificationPreference`

**Lý do:**
- Phase 3 đã đủ phức tạp (RBAC, OTP, email flow)
- Thêm preferences → scope creep không cần thiết
- Phase 4 có thể thêm với ít effort (notification service hoàn toàn độc lập)

**Placeholder cho Phase 4:**
- Tạo column `user_id` + `notification_type` (OTP, PASSWORD_RESET, MARKETING, v.v.)
- Middleware `checkNotificationPreference(type)` trước khi gửi email
- Admin dashboard để users cấu hình preferences

---

## Tóm Tắt Quyết Định

| Câu hỏi | Quyết định | Ghi chú |
|--------|-----------|--------|
| Email Provider | **Nodemailer + SMTP** | Config `.env`, chuyển sang SES sau mà không đổi code |
| User Profiles | **Bảng riêng biệt** | FK → users, support mở rộng sau |
| Email Verification | **Tùy chọn, được theo dõi** | Không chặn login, flag trong DB |
| Reset Token | **JWT (5 phút)** | Stateless, TTL ngắn = an toàn |
| Notification Prefs | **Phase 4** | Phase 3 gửi tất cả, config sau |

---

## Hướng Dẫn Triển Khai Tiếp Theo

Với các quyết định đã finalize, có thể bắt đầu triển khai từ **Bước 1** ngay:

1. **Bước 1-2:** Middleware RBAC
2. **Bước 2-3:** OTP System + Nodemailer setup
3. **Bước 3-4:** Email templates + verification endpoint
4. **Bước 5-6:** Password reset + JWT tokens
5. **Bước 6-7:** Profile endpoints + user_profiles table
6. **Bước 7-8:** Tests & documentation

**Lưu ý:** 
- Tạo `.env.example` với sample values cho Nodemailer (Mailtrap)
- Dùng Mailtrap inbox cho dev/test (free tier đủ)
- Code abstraction layer cho email service (prepare cho SES migration)
