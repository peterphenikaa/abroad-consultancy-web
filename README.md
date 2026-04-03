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

| Service              | Port | Purpose          | Database           |
| -------------------- | ---- | ---------------- | ------------------ |
| api-gateway          | 8080 | Route, WAF, auth | -                  |
| auth-service         | 3000 | Authentication   | PostgreSQL         |
| user-service         | 3001 | User profiles    | PostgreSQL         |
| ai-rag-service       | 3002 | AI + RAG + Chat  | MongoDB + Pinecone |
| content-service      | 3003 | Course content   | PostgreSQL + MinIO |
| exam-service         | 3004 | Exam system      | PostgreSQL         |
| quiz-service         | 3005 | Quiz system      | PostgreSQL         |
| payment-service      | 3006 | Payments         | PostgreSQL         |
| notification-service | 3007 | Email/SMS        | PostgreSQL         |
| search-service       | 3008 | Full-text search | Elasticsearch      |
| analytics-service    | 3009 | Metrics          | PostgreSQL         |

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
