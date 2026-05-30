# Kế Hoạch Phát Triển `user-service`

## 1. Mục Tiêu

- Tách phần quản lý User Profile (thông tin cá nhân) ra khỏi `auth-service` (dịch vụ xác thực).
- Xây dựng `user-service` dưới dạng một microservice độc lập, viết bằng TypeScript, sử dụng Express, Prisma và Zod.
- Dọn dẹp lại code thừa ở `auth-service` (xóa route, controller, service, schema liên quan đến User Profile).

## 2. Setup khung `user-service` \* Xóa file rỗng/cũ `index.js`.

- Khởi tạo dự án Node.js với cấu hình TypeScript chuẩn (sao chép thiết lập cấu trúc từ `auth-service` gồm `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.env`).
- Cài đặt các package cần thiết:
  - Core: `express`, `cors`, `helmet`, `cookie-parser`, `dotenv`.
  - Validation: `zod`.
  - ORM: `prisma`, `@prisma/client`.
  - Logging: `pino`, `pino-http`.
  - Dev: `typescript`, `tsx`, `jest`, `supertest`... (Không cài đặt KafkaJS theo yêu cầu).
- Tổ chức thư mục chuẩn hóa: `config/`, `constants/`, `lib/`, `middleware/`, `modules/`, `types/`, `utils/`.

## 3. Thiết kế Database (`user-service/prisma/schema.prisma`)

- Tạo schema mới dùng PostgreSQL cho `user-service`.
- Bảng `User` (Đồng bộ tối giản từ Auth):
  - `id`: String (UUID truyền từ Auth sang)
  - `email`: String (Unique)
  - `role`: String (hoặc Enum)
  - `status`: String (hoặc Enum)
- Bảng `UserProfile` (Liên kết 1-1 với `User`):
  - `userId`: String (Khóa chính kiêm ngoại liên kết tới User)
  - `fullName`: String (nullable)
  - `bio`: String (nullable)
  - `avatarUrl`: String (nullable)
  - `phone`: String (nullable)
  - `educationalLevel`: String (nullable)
  - `learningGoals`: String (nullable)
- _Lưu ý: Không dùng tính năng Upload S3/MinIO ở giai đoạn này. AvatarUrl chỉ là text lưu đường dẫn._

## 4. Xây dựng API tại `user-service`

- Các API dành cho Client (Cần bảo vệ bằng token JWT):
  - `GET /api/users/me`: Lấy thông tin cá nhân. Sẽ áp dụng cơ chế "Lazy Creation" (Nếu token hợp lệ mà trong DB chưa có Profile, tự tạo một profile trống trả về).
  - `PUT /api/users/me`: Cập nhật thông tin profile. Validate payload thông qua Zod schema.
- Các API dành cho Admin / Quản lý:
  - `GET /api/users/:id`: Xem thông tin một user bất kỳ.
  - `GET /api/users`: Lấy danh sách các users (có phân trang, search).
- API Internal (Giao tiếp đồng bộ):
  - `POST /internal/users/sync`: Nhận webhook/HTTP Request từ `auth-service` khi đăng ký mới để đồng bộ User core info.

## 5. Dọn dẹp `auth-service` (Migration)

- `schema.prisma`: Xóa `model UserProfile`. Chạy lại `npx prisma generate` và tạo file migrate.
- Xóa toàn bộ folder `src/modules/user` (bao gồm `user.controller.ts`, `user.route.ts`, `user.schema.ts`, `user.service.ts`).
- Sửa file `src/app.ts`: Xóa dòng `app.use('/api/auth/users', userRouter);` và các import liên quan.

## 6. Cập nhật Gateway / Infrastructure

- Kiểm tra file `docker-compose.yml` để chắc chắn `user-service` có kết nối với một DB riêng biệt hoặc cùng server DB nhưng khác database name (vd: `user_db`).
- Nếu dự án có API Gateway (Kong), cần đảm bảo cấu hình Route của Kong sẽ forward đường dẫn `/api/users/*` về cổng `3002` của `user-service`.
