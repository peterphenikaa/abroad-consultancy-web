# A. KIỂM ĐỊNH API CHÍNH (SMOKE TESTS)

1. API Đăng ký (Register - POST /api/auth/register)

- [x] Gửi body hợp lệ (email mới) -> Trả về 201 Created kèm thông tin user (không chứa password).
- [x] Gửi email đã tồn tại trong DB -> Trả về chuẩn xác lỗi 409 Conflict.
- [x] Gửi body thiếu email/password hoặc sai format -> Trả về 400 Bad Request (Zod validation hoạt động, app không bị crash).

2. API Đăng nhập (Login - POST /api/auth/login)

- [x] Đăng nhập thành công -> Trả về 200 OK. Body chứa access_token.
- [x] Header response có dòng Set-Cookie: refresh_token=...; HttpOnly; Secure.
- [x] Kiểm tra Database (bảng Session): Bản ghi mới được tạo có chứa IP và User-Agent chính xác.
- [x] Gửi sai password hoặc sai email -> Trả về chung lỗi 401 Unauthorized (Thông báo chung chung để chống Hacker dò quét email).
- [ ] (Tùy chọn) Đăng nhập bằng User có status BANNED hoặc LOCKED -> Trả về 403 Forbidden.

3. API Làm mới Token (Refresh - POST /api/auth/refresh)

- [x] Gửi request KHÔNG có cookie refresh_token -> Trả về 401 Unauthorized.
- [x] Gửi request có cookie hợp lệ -> Trả về 200 OK. Body có access_token mới tinh. Cookie được set lại bằng một refresh_token mới.
- [x] Kiểm tra Token Rotation (Cực kỳ quan trọng): Cầm cái token CŨ vừa bị thay thế bắn request lên lần nữa -> Bị reject ngay lập tức bằng lỗi 401 kèm cảnh báo hệ thống (Blacklist/Token Theft hoạt động).

4. API Đăng xuất (Logout - POST /api/auth/logout)

- [x] Gọi API khi có cookie -> Trả về 200 OK và header xóa cookie (Clear-Cookie).
- [x] Kiểm tra DB: Session cũ đã bị xóa hoặc update revoked_at.
- [x] Cầm lại cái token vừa bị đăng xuất gọi vào API Refresh -> Bị reject 401 (Revocation hoạt động thật).
- [x] Gọi API Logout nhiều lần liên tiếp (khi không còn cookie) -> Vẫn trả về 200 OK (Tính Idempotency).

🛡️ B. KIỂM ĐỊNH BẢO MẬT & KIẾN TRÚC (DEFINITION OF DONE)

1. Xử lý Token & Session (Bắt buộc pass)

- [x] KHÔNG lưu raw refresh token dưới dạng plain-text trong Database (Chỉ lưu hashedRefreshToken).
- [x] Password của User tạo ra trong DB đã được băm (Bcrypt/Argon2), tuyệt đối không lưu chữ thô.
- [x] Token bị thu hồi (sau khi Rotate hoặc Logout) được tống vào sổ đen Redis với thời gian sống (TTL) chính xác.
- [x] Payload của Access Token chứa đúng userId và role để chuẩn bị cho bước Gateway giải mã.

2. Tiêu chuẩn Code & DevOps

- [x] Mọi HTTP Response Lỗi (4xx, 5xx) đều có format đồng nhất (RFC 7807) chứa type, title, status, detail, code do Global Error Handler xử lý.
- [x] Chạy lệnh build (npm run build hoặc tsc) thành công 100%, không bị lỗi TypeScript (Implicit any, sai type).
- [x] Chạy lệnh docker-compose up khởi động thành công (App boot lên và connect được với PostgreSQL + Redis).
