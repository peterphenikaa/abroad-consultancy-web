# Study Abroad AI - Microservices Architecture

Hệ thống web du học với AI theo chuẩn Microservices cho phép scale độc lập từng service.

## 📦 Tech Stack

### **Layers**

- **Frontend:** React 18 + Vite + Tailwind CSS
- **API Gateway:** Kong Gateway (Port 8080) - WAF, Rate Limiter, Auth Middleware
- **Backend:** Node.js 22 + Express.js
- **Message Queue:** Kafka + DLQ (Dead Letter Queue)

### **Databases (Polyglot Persistence)**

- **PostgreSQL:** Structured data (users, exams, payments)
- **MongoDB:** Chat history, document-based data
- **Redis:** Distributed cache & session store
- **Pinecone:** Vector embeddings for RAG
- **Elasticsearch:** Full-text search + logs

### **Storage & External**

- **MinIO:** S3-compatible object storage
- **LLM APIs:** OpenAI, Claude (for ai-rag-service)

### **Monitoring**

- **ELK Stack:** Elasticsearch + Logstash + Kibana (centralized logs)
- **Prometheus & Grafana:** Metrics & visualization

## 📂 Cấu trúc thư mục

```
/do_an_lien_nganh
├── client/              # React Frontend (Port 80)
├── api-gateway/         # API Gateway (Port 8080)
├── services/            # Microservices
│   ├── auth-service/    # Login, JWT, tokens
│   ├── user-service/    # User profiles
│   ├── ai-rag-service/  # AI processing + RAG
│   ├── content-service/ # Course management
│   ├── exam-service/    # Exam management
│   ├── quiz-service/    # Quiz system
│   ├── payment-service/ # Payment
│   ├── notification-service/ # Email/SMS
│   ├── search-service/  # Full-text search
│   └── analytics-service/ # Metrics
├── shared/              # Shared code & types
├── docker-compose.yml   # Infrastructure
└── README.md
```

## 🚀 Quick Start

### Setup Environment

Tạo `.env` tại root:

```env
DATABASE_URL=postgresql://root:password@postgres:5432/main_db
MONGO_URI=mongodb://mongodb:27017/ai_chat
REDIS_URL=redis://redis:6379
KAFKA_BROKER=kafka:9092
MINIO_ENDPOINT=minio
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-xxxxx
```

### Run with Docker

```bash
docker-compose up --build -d
```

**Access:**

- Frontend: http://localhost
- API Gateway: http://localhost:8080
- MinIO: http://localhost:9001

### Run Local Development

```bash
# Terminal 1: Infrastructure
docker-compose up postgres mongodb redis kafka

# Terminal 2: Service
cd services/auth-service && npm install && npm start

# Terminal 3: Frontend
cd client && npm install && npm run dev
```

## ⚙️ Services

| Service                  | Port | Purpose                                   | Database/Storage   |
| ------------------------ | ---- | ----------------------------------------- | ------------------ |
| `api-gateway`            | 8080 | Cổng giao tiếp, Rate limit, Auth, Routing | Redis (Rate limit) |
| `auth-service`           | 3001 | Đăng nhập, JWT, OAuth (Supabase)          | PostgreSQL, Redis  |
| `user-service`           | 3002 | Quản lý Profile người dùng                | PostgreSQL         |
| `ai-rag-service`         | 3003 | Tư vấn du học AI bằng RAG                 | Pinecone, MongoDB  |
| `content-service`        | 3004 | Quản lý khóa học, bài giảng video/PDF     | PostgreSQL, MinIO  |
| `exam-service`           | 3005 | Bài thi thử (Mock Test)                   | PostgreSQL         |
| `quiz-service`           | 3006 | Bài tập trắc nghiệm ngắn                  | PostgreSQL         |
| `search-service`         | 3007 | Tìm kiếm Full-text nội dung               | Elasticsearch      |
| `payment-service`        | 3008 | Thanh toán học phí, dịch vụ               | PostgreSQL         |
| `notification-service`   | 3009 | Gửi Email, SMS qua Kafka events           | MongoDB (Log)      |
| `analytics-service`      | 3010 | Thu thập metrics, thống kê học tập        | Elasticsearch      |
| `data-crawler-service`\* | -    | (Dự kiến) Crawl data trường học, visa     | N/A                |

## 🗺️ Roadmap & To-Do List (End-to-End)

### Giai đoạn 1: Infrastructure & Foundation (Hạ tầng cơ sở)

- [x] Khởi tạo kiến trúc thư mục microservices.
- [x] Setup `docker-compose.yml` (Postgres, Mongo, Redis, Kafka, Zookeeper, MinIO).
- [x] Cấu hình API Gateway (Kong/Express): Thiết lập proxy routing tới các services.
- [x] Setup Middleware tại Gateway: Cấu hình Rate Limiting (Redis), JWT Authentication chặn request ảo.
- [x] Thiết lập hệ thống Typography & Design Tokens (Tailwind + CSS variables) cho Frontend.

### Giai đoạn 2: Core Microservices (Phần nghiệp vụ lõi)

- [ ] **Auth & User**: Hoàn thiện API Đăng nhập/Đăng ký, cấp phát và verify JWT. Tích hợp Supabase.
- [x] **Content Service**: Xây dựng API CRUD khóa học. Code luồng upload file (Video/PDF bài giảng) lên MinIO bằng presigned URL.
- [ ] **Exam & Quiz Service**: Thiết kế Database Schema lưu trữ ngân hàng câu hỏi, bài thi chứng chỉ (IETLS/TOEFL). Viết API chấm điểm tự động.
- [ ] **Giao tiếp liên dịch vụ (Kafka)**: Setup các Kafka Producer/Consumer cơ bản. Ví dụ: Tạo user mới -> Bắn event `USER_CREATED` ra Message queue.

### Giai đoạn 3: AI & Data Pipeline (Trái tim của hệ thống)

- [x] Xây dựng **Data Crawler Service**: Viết scripts định kỳ tự động thu thập thông tin quy chế Visa, học phí, các trường đại học.
- [x] **ETL Pipeline**: Làm sạch dữ liệu crawl được, lưu bản gốc vào PostgreSQL.
- [x] **Search Service (Elasticsearch)**: Đồng bộ index dữ liệu từ Postgres qua Elasticsearch phục vụ tìm kiếm toàn văn bản siêu tốc.
- [ ] **AI RAG Service**:
  - Chuyển đổi dữ liệu văn bản thành Vector Embeddings (via OpenAI/Claude API) và đưa vào Pinecone.
  - Xây dựng luồng Chatbot: Nhận câu hỏi -> Tìm kiếm ngữ cảnh trong Pinecone -> Nạp data vào Prompt -> LLM trả lời chuyên sâu.

### Giai đoạn 4: Advanced Services (Các tính năng nâng cao)

- [ ] **Notification Service**: Lắng nghe Kafka event (như `PAYMENT_SUCCESS`, `EXAM_REMINDER`) để gửi Email/SMS cho học viên.
- [ ] **Payment Service**: Tích hợp cổng thanh toán (Stripe / VNPay) thực hiện mua khoá học, dịch vụ làm hồ sơ.
- [ ] **Analytics Service**: Tracking hành vi người học, thời gian hoàn thành khóa học, phân tích điểm yếu để gợi ý ôn tập.

### Giai đoạn 5: Frontend Development (Giao diện người dùng)

- [ ] Xây dựng hệ thống UI Components (Dựa trên File `theme.css` + Radix/Shadcn UI).
- [ ] Cấu trúc Routing (React Router) cho App. Thực hiện luồng Login / Protected Routes.
- [ ] Dashboard Học Sinh: Xem tiến trình học tập, khoá học đã mua, bài test sắp tới.
- [ ] Giao diện Bài Test: Luồng làm bài thi kéo thả, thi tính giờ, nghe audio tương tự nền tảng thi thật.
- [ ] Giao diện RAG AI Chat: Khung chat real-time, có hiển thị trích dẫn (citations) bài viết mà AI lấy dữ liệu để trả lời.
- [ ] Admin Portal: Upload tài liệu CMS, xem thống kê doanh thu, quản lý account học viên.

### Giai đoạn 6: Testing, DevOps & Deployment (Triển khai & Vận hành)

- [ ] Viết Unit/Integration Test cho các nghiệp vụ chính (RAG, Chấm điểm bài thi, Thanh toán).
- [ ] Thiết lập CI/CD pipelines (GitHub Actions/GitLab CI) để tự động check code, build docker images.
- [ ] Cấu hình Monitor: ELK Stack (xem Log tập trung), Prometheus & Grafana (Theo dõi sức khoẻ CPU, RAM).
- [ ] Tối ưu hóa Dockerfiles (Dùng multi-stage build cho nhẹ) và Deploy lên Cloud cluster (AWS / Azure).
      | api-gateway | 8080 | Route, WAF, auth | - |
      | auth-service | 3000 | Authentication | PostgreSQL |
      | user-service | 3001 | User profiles | PostgreSQL |
      | ai-rag-service | 3002 | AI + RAG + Chat | MongoDB + Pinecone |
      | content-service | 3003 | Course content | PostgreSQL + MinIO |
      | exam-service | 3004 | Exam system | PostgreSQL |
      | quiz-service | 3005 | Quiz system | PostgreSQL |
      | payment-service | 3006 | Payments | PostgreSQL |
      | notification-service | 3007 | Email/SMS | PostgreSQL |
      | search-service | 3008 | Full-text search | Elasticsearch |
      | analytics-service | 3009 | Metrics | PostgreSQL |

## 🚪 API Gateway (Kong Gateway)

**Features:**

- **Routing:** Direct requests to appropriate microservices
- **WAF (Web Application Firewall):** Block malicious requests
- **Rate Limiting:** Prevent abuse (e.g., max 1000 req/min per user)
- **Authentication Middleware:** Verify JWT tokens before routing
- **Load Balancing:** Distribute traffic across service replicas
- **CORS & Headers:** Manage cross-origin & security headers

## 🧠 AI Service Architecture (ai-rag-service)

**Multi-layer AI system:**

1. **LLM Gateway:** Connects to OpenAI, Claude, or local models
2. **RAG Pipeline:** Retrieval-Augmented Generation
   - User query → Embed to vector → Search in Pinecone → Retrieve relevant docs → Send to LLM → Stream response
3. **Data Layer:**
   - **MongoDB:** Store chat history (messages, metadata, user context)
   - **Pinecone:** Vector embeddings for semantic search of documents

**Sample MongoDB chat schema:**

```javascript
{
  userId: "user-123",
  messages: [
    { role: "user", content: "...", timestamp, embedding },
    { role: "assistant", content: "...", timestamp }
  ],
  createdAt, updatedAt
}
```

## 📬 Kafka Topics & DLQ

**Topics:**

- `user.registered` → user-service, notification-service
- `content.created` → search-service, analytics-service
- `ai.query` → ai-rag-service
- `ai.response` → notification-service
- `exam.submitted` → analytics-service
- `payment.received` → notification-service

**Dead Letter Queue (DLQ):** Failed messages automatically routed to `{topic}-dlq` for debugging & retry

## 🛠️ Create New Service

```bash
mkdir services/new-service && cd services/new-service
npm init -y && npm install express cors dotenv
```

Then add to docker-compose.yml and run:

```bash
docker-compose up --build new-service
```

## 📊 Monitoring & Observability

### **Logs (ELK Stack)**

- **Elasticsearch:** Central log storage
- **Logstash:** Log ingestion & transformation
- **Kibana:** Visualization & search interface

```bash
# View real-time logs
docker-compose logs -f service-name

# Search in Kibana
# Visit http://localhost:5601
```

### **Metrics (Prometheus + Grafana)**

- **Prometheus:** Scrape metrics from services
- **Grafana:** Dashboard visualization
- Visit `http://localhost:3000` (Grafana)

### **Kafka Monitoring**

```bash
# Monitor messages in topic
docker exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 --topic user.registered

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health
```

## 🔐 Environment Setup

- Save credentials in `.env` (don't commit)
- JWT short-lived access tokens (15 min)
- Refresh tokens in HTTP-only cookies
- Use connection pooling for databases
- Parameterized queries (Prisma handles)

---

**For detailed service descriptions and architecture patterns, see the full documentation in `doc/ARCHITECTURE.md`**
