# Auth Service

- Authentication
- Authorization
- Session control

## Tech stack

- **Framework:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Cache & Session:** Redis
- **Logger:** Pino

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose

## Getting started

### 1. Thiết lập biến môi trường

Tạo file `.env` ở thư mục gốc của `auth-service` và điền các thông tin sau:

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Database & Redis (Trỏ về localhost nếu chạy code ở ngoài Docker)
DATABASE_URL="postgresql://user:password@localhost:5432/auth_db?schema=public"
REDIS_URL="redis://localhost:6379"
```

### 2. Install dependencies

```bash
npm i
```

### 3. Setup infrastructure

run docker compose in project root

```bash
docker compose up -d
```

### 4. Database migration

npm run prisma:migrate:dev

### 5. Run

- Development: `npm run dev`
