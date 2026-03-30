# Study Abroad AI - Tech Test Codebase

Dự án này được tạo ra để test deploy cho hệ thống web du học tích hợp AI.

## Tech Stack
-   **Frontend:** React JS (Vite) + Tailwind CSS
-   **Backend:** Express JS + Prisma ORM
-   **Database:** Supabase (PostgreSQL)
-   **Task Queue:** Redis + BullMQ (dùng cho AI Processing)
-   **UI:** Tailwind CSS + Framer Motion + Lucide Icons

## Cấu trúc thư mục
-   `/client`: Source code React frontend
-   `/server`: Source code Express backend + Workers
-   `docker-compose.yml`: Dùng để chạy Redis local nhanh chóng

## Hướng dẫn cài đặt & Chạy

### 1. Chuẩn bị Supabase
Tạo bảng `ai_interactions` trong Supabase SQL Editor:
```sql
create table ai_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  prompt text not null,
  response text not null,
  created_at timestamp with time zone default now()
);

-- Enable Realtime for this table if needed
alter table ai_interactions replica identity full;
```

### 2. Cấu hình .env & Prisma
-   Vào thư mục `server`, điền thông tin vào file `.env`:
    -   `DATABASE_URL`: Link kết nối trực tiếp đến Postgres của Supabase.
    -   `SUPABASE_URL` & `SUPABASE_KEY`: Để dùng Supabase SDK nếu cần.
-   Chạy Prisma để tạo Client:
    ```bash
    cd server
    npx prisma generate
    ```

### 3. Chạy toàn bộ với Docker (Khuyên dùng cho Deploy)
Bạn có thể dùng Docker Compose để chạy toàn bộ stack (Frontend, Backend, Redis):
-   Điền thông tin vào file `.env` ở **thư mục gốc**.
-   Chạy lệnh:
    ```bash
    docker-compose up --build -d
    ```
-   Truy cập:
    -   Frontend: `http://localhost` (Cổng 80)
    -   Backend Health: `http://localhost:5000/health`

### 4. Chạy Backend (Local)
```bash
cd server
npm install
npx prisma generate
node index.js
```

### 5. Chạy Frontend (Local)
```bash
cd client
npm install
npm run dev
```

## Lưu ý Deploy
-   Khi deploy lên VPS/Cloud (như Render, Railway, DigitalOcean, v.v.):
    -   Hãy đảm bảo đã cấu hình các biến môi trường (Environment Variables).
    -   Đảm bảo Redis instance đã bật và có thể kết nối từ backend.
    -   Frontend cần build (`npm run build`) và server backend cần phục vụ file tĩnh hoặc dùng proxy hợp lý.
