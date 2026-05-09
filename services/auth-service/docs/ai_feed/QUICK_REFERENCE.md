# Auth Service - Quick Reference Guide

## Quick Start

### Setup (First Time)
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Start development server
npm run dev
```

### Run
```bash
# Development (with hot reload)
npm run dev

# Production (requires build first)
npm run build
npm start

# Build TypeScript
npm run build

# Type check
tsc --noEmit
```

### Database
```bash
# Apply pending migrations
npm run prisma:migrate:deploy

# Create new migration
npm run prisma:migrate:dev --name migration_name

# Open Prisma Studio (GUI)
npm run prisma:studio
```

---

## API Endpoints

### Register New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response: 200 OK
Set-Cookie: refresh_token=...; HttpOnly; Path=/; SameSite=Strict

{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": "15m",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "STUDENT"
  }
}
```

### Refresh Token
```bash
POST /api/auth/refresh
Cookie: refresh_token=...

Response: 200 OK
Set-Cookie: refresh_token=...; HttpOnly; Path=/; SameSite=Strict

{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": "15m"
}
```

### Logout
```bash
POST /api/auth/logout
Cookie: refresh_token=...

Response: 200 OK
Set-Cookie: refresh_token=; Max-Age=0

{
  "message": "Logged out successfully"
}
```

### Health Check
```bash
GET /health

Response: 200 OK
{
  "status": "UP",
  "timestamp": "2026-05-05T08:40:00.000Z"
}
```

### Readiness Check
```bash
GET /ready

Response: 200 OK
{
  "status": "READY",
  "db": "UP",
  "redis": "UP"
}
```

---

## Environment Variables

### Required
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY=@keys/jwtRS256.key
JWT_PUBLIC_KEY=@keys/jwtRS256.key.pub
```

### Optional (with defaults)
```env
LOG_LEVEL=info                          # Default: info
ACCESS_TOKEN_TTL=15m                    # Default: 15m
REFRESH_TOKEN_TTL_DAYS=30               # Default: 30
BCRYPT_ROUNDS=12                        # Default: 12
COOKIE_DOMAIN=localhost                 # Default: localhost
COOKIE_SECURE=false                     # Default: false (true in prod)
JWT_KID=auth-service-key-v1             # Default: auth-service-key-v1
```

---

## File Structure Quick Map

```
src/
├── index.ts                  ← Entry point
├── app.ts                    ← Express app setup
├── config/
│   ├── env.ts               ← Environment validation
│   └── logger.ts            ← Logging setup
├── lib/
│   ├── prisma.ts            ← Database connection
│   └── redis.ts             ← Cache connection
├── modules/
│   ├── auth/
│   │   ├── auth.route.ts    ← Routes (/register, /login, etc.)
│   │   ├── auth.controller.ts  ← Request/response handling
│   │   ├── auth.service.ts  ← Business logic (register, login, refresh)
│   │   ├── auth.scheme.ts   ← Zod validation schemas
│   │   └── auth.constant.ts ← Constants (error messages)
│   └── session/
│       └── session.service.ts  ← Session & token management
├── types/
│   └── shared.type.ts       ← Global TypeScript types
└── utils/
    ├── api-error.util.ts    ← Error handling class
    ├── crypto.util.ts       ← Password & token hashing
    └── jwt.util.ts          ← RS256 token operations
```

---

## Key Concepts

### Password Storage
- Hashed with **Bcrypt** (12 rounds)
- Never stored as plain text
- Safe comparison during login

### Access Token
- **RS256** JWT (asymmetric)
- 15 minutes lifetime
- Contains userId + role
- Cannot be forged without private key

### Refresh Token
- **Opaque** random token (32 bytes)
- Stored as **SHA256 hash** in database
- Sent as **HttpOnly cookie** to client
- **Rotates** on every refresh

### Token Rotation
- Old token immediately blacklisted
- Prevents token reuse after compromise
- Blacklist stored in **Redis** with TTL

### Session
- Tracks device info + client IP
- Records refresh token hash (not raw)
- Can be revoked (revoked_at set)
- Expires after 30 days

---

## Error Response Format

### All Errors (RFC 7807)
```json
{
  "error": {
    "type": "about:blank",
    "title": "HTTP Status Title",
    "status": 400,
    "detail": "Detailed error message",
    "code": "ERROR_CODE",
    "errors": { "field": ["field error message"] }
  }
}
```

### Common Errors
| Status | Code | Meaning |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Request body invalid |
| 401 | INVALID_CREDENTIALS | Email/password incorrect |
| 401 | UNAUTHORIZED | Missing/invalid token or session |
| 401 | TOKEN_BLACKLISTED | Token reused after rotation |
| 403 | ACCOUNT_INACTIVE | User banned/locked/inactive |
| 409 | EMAIL_EXISTS | Email already registered |
| 503 | - | Database or Redis offline |

---

## Database Models

### User Table
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE INDEXED
password_hash   VARCHAR(255)
full_name       VARCHAR(255)
role            ENUM (STUDENT, TEACHER, ORG_ADMIN, CONTENT_CREATOR, SUPER_ADMIN)
status          ENUM (ACTIVE, INACTIVE, LOCKED, BANNED)
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP
deleted_at      TIMESTAMP (soft delete support)
```

### UserSession Table
```sql
id                  UUID PRIMARY KEY
user_id             UUID FK → users
refresh_token_hash  VARCHAR(255) INDEXED
revoked_at          TIMESTAMP (NULL = active)
last_used_at        TIMESTAMP
expires_at          TIMESTAMP INDEXED
device_info         TEXT
ip                  VARCHAR(45)
created_at          TIMESTAMP DEFAULT now()
```

### Redis Keys
```
auth:refresh:blacklist:<token_hash>  → Value: "revoked", TTL: session lifetime
```

---

## Testing API with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Refresh
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

### Health Check
```bash
curl http://localhost:3001/health
```

---

## Code Patterns

### Add New Endpoint
1. **Add route** in `src/modules/auth/auth.route.ts`
2. **Add controller method** in `src/modules/auth/auth.controller.ts`
3. **Add service method** in `src/modules/auth/auth.service.ts`
4. **Add validation schema** in `src/modules/auth/auth.scheme.ts`

### Error Handling
```typescript
import { ApiError } from '../../utils/api-error.util';

throw new ApiError(
  400,                      // HTTP status
  'Description',            // Message
  'ERROR_CODE',             // Error code
  { field: ['error'] }      // Optional field errors
);
```

### Logging
```typescript
import { logger } from '../../config/logger';

logger.info('Info message');
logger.warn('Warning message');
logger.error({ err }, 'Error with exception');
```

### Database Query
```typescript
import { prisma } from '../../lib/prisma';

const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});
```

### Redis Operation
```typescript
import { redisClient } from '../../lib/redis';

await redisClient.setex('key', 3600, 'value');
const value = await redisClient.get('key');
```

---

## Debugging

### Enable Query Logging
```env
NODE_ENV=development  # Automatically logs queries
```

### View Logs
```bash
# Filter by level
npm run dev 2>&1 | grep ERROR

# Pretty print JSON logs
npm run dev 2>&1 | jq .
```

### Database Studio
```bash
npm run prisma:studio
# Opens GUI at http://localhost:5555
```

### Check Services Health
```bash
# All in one
curl http://localhost:3001/ready

# Just DB/Redis
curl http://localhost:3001/ready | jq .
```

---

## Common Issues

### Issue: ECONNREFUSED on port 3001
**Cause:** Service not running
**Fix:** `npm run dev`

### Issue: Database migration failed
**Cause:** Database offline or schema mismatch
**Fix:**
```bash
# Reset (dangerous - only in dev!)
npm run prisma:migrate:dev --name init

# Or check DB connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: Token always invalid
**Cause:** JWT keys misconfigured
**Fix:**
```bash
# Verify keys are PEM format
cat keys/jwtRS256.key | head -1  # Should start with -----BEGIN
cat keys/jwtRS256.key.pub | head -1  # Should start with -----BEGIN PUBLIC
```

### Issue: Redis connection timeout
**Cause:** Redis offline or wrong URL
**Fix:**
```bash
# Test connection
redis-cli -u $REDIS_URL ping  # Should return PONG
```

### Issue: HttpOnly cookies not working
**Cause:** COOKIE_SECURE=true with HTTP
**Fix:**
```env
# For localhost development
COOKIE_SECURE=false

# For HTTPS production
COOKIE_SECURE=true
```

---

## Performance Tips

### Indexing
- ✅ Email indexed for login queries
- ✅ user_id indexed for session lookup
- ✅ refresh_token_hash indexed for token verification
- ✅ expires_at indexed for cleanup queries

### Redis Tuning
- Blacklist entries auto-expire (TTL)
- Keep Redis memory bounded with maxmemory-policy
- Monitor connection pool (ioredis handles this)

### Database Tuning
- Prisma uses connection pooling (pg adapter)
- Query logging helps identify slow queries
- Consider caching frequently accessed data

---

## Security Checklist

- ✅ Password hashed with Bcrypt (12 rounds)
- ✅ Access tokens signed with RS256
- ✅ Refresh tokens hashed before storage
- ✅ Token rotation enforced
- ✅ Old tokens blacklisted immediately
- ✅ HttpOnly cookies prevent XSS
- ✅ SameSite=strict prevents CSRF
- ✅ Account status validated
- ✅ No sensitive data in responses
- ✅ Helmet security headers enabled
- ✅ CORS configured appropriately

---

## Useful NPM Scripts

```bash
npm run dev                  # Start with hot reload
npm run build               # Compile TypeScript
npm start                   # Run compiled code
npm run lint                # Check code style
npm run lint:fix            # Auto-fix style issues
npm run format              # Format code with Prettier
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate:dev  # Create and run migration
npm run prisma:studio       # Open database GUI
```

---

## Documentation Files

- `PHASE2_ANALYSIS.md` - Complete Phase 2 implementation details
- `ARCHITECTURE.md` - System architecture and data flows
- `QUICK_REFERENCE.md` - This file
- `docs/plans/auth-phase2.md` - Original Phase 2 plan
- `docs/plans/phase2-check.md` - Phase 2 completion checklist

