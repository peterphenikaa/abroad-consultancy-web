# Auth Service Architecture - Visual Summary

## Request/Response Flow

### Registration Flow

```
Client Request
    ↓
POST /api/auth/register {email, password, fullName}
    ↓
Auth Controller
├─ Zod validation
└─ Extract body
    ↓
Auth Service.register()
├─ Check email uniqueness (Prisma)
├─ Hash password (Bcrypt)
├─ Create User record (Prisma)
└─ Return user (no password_hash)
    ↓
Response: 201 Created {user}
```

### Login Flow

```
Client Request
    ↓
POST /api/auth/login {email, password}
    ↓
Auth Controller
├─ Zod validation
├─ Extract IP & User-Agent
└─ Create ClientContext
    ↓
Auth Service.login()
├─ Find user by email (Prisma)
├─ Verify password (Bcrypt)
├─ Check status = ACTIVE
├─ Sign access token (RS256)
├─ Generate refresh token (crypto.random)
├─ Hash refresh token (SHA256)
├─ Create session (Prisma) with:
│  ├─ user_id
│  ├─ refresh_token_hash
│  ├─ expires_at
│  ├─ device_info
│  └─ ip
└─ Return tokens
    ↓
Auth Controller
├─ Set cookie: refresh_token (HttpOnly)
└─ Response: 200 OK {access_token, user}
```

### Token Refresh Flow (Rotation)

```
Client Request
    ↓
POST /api/auth/refresh (with refresh_token cookie)
    ↓
Auth Controller
├─ Extract refresh_token from cookie
└─ Check if present
    ↓
Auth Service.refreshToken()
├─ Hash the refresh token (SHA256)
├─ Check Redis blacklist
├─ Find session by hash (Prisma)
├─ Verify not revoked & not expired
├─ Check user status = ACTIVE
├─ Generate new refresh token
├─ Generate new access token (RS256)
├─ Update session (Prisma):
│  ├─ New refresh_token_hash
│  ├─ New expires_at
│  └─ Update last_used_at
├─ Blacklist old token (Redis TTL)
└─ Return new tokens
    ↓
Auth Controller
├─ Set new cookie: new_refresh_token (HttpOnly)
└─ Response: 200 OK {access_token}
```

### Logout Flow

```
Client Request
    ↓
POST /api/auth/logout (with refresh_token cookie)
    ↓
Auth Controller
├─ Extract refresh_token from cookie
└─ Check if present (optional)
    ↓
Auth Service.logout()
├─ Hash the refresh token
├─ Find session by hash (Prisma)
├─ Set revoked_at = now() (Prisma)
├─ Blacklist token (Redis TTL)
└─ Return success
    ↓
Auth Controller
├─ Clear cookie
└─ Response: 200 OK
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                     │
│  (Web/Mobile - Stores access_token in memory/session)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  (JWT verification with RS256 public key)                   │
│  Routes: /api/auth/* → auth-service:3001                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Auth Service (Port 3001)                 │
├─────────────────────────────────────────────────────────────┤
│                    Express Application                      │
│  ├─ Helmet (security headers)                               │
│  ├─ CORS (cross-origin)                                     │
│  ├─ Cookie Parser                                           │
│  └─ Pino Logger (HTTP middleware)                           │
├─────────────────────────────────────────────────────────────┤
│                    Route: /api/auth/*                       │
│  ├─ POST /register                                          │
│  ├─ POST /login                                             │
│  ├─ POST /refresh                                           │
│  └─ POST /logout                                            │
├─────────────────────────────────────────────────────────────┤
│                Auth Service Layer (Business Logic)          │
│  ├─ User management (CRUD)                                  │
│  ├─ Token generation (RS256)                                │
│  ├─ Token rotation logic                                    │
│  ├─ Session management                                      │
│  └─ Password verification (Bcrypt)                          │
├─────────────────────────────────────────────────────────────┤
│              PostgreSQL (User & Session Data)               │
│  ├─ users table                                             │
│  │  ├─ id (UUID)                                            │
│  │  ├─ email (UNIQUE)                                       │
│  │  ├─ password_hash (Bcrypt)                               │
│  │  ├─ role (RBAC)                                          │
│  │  ├─ status (ACTIVE/INACTIVE/LOCKED/BANNED)               │
│  │  └─ timestamps                                           │
│  └─ user_sessions table                                     │
│     ├─ id (UUID)                                            │
│     ├─ user_id (FK)                                         │
│     ├─ refresh_token_hash (SHA256)                          │
│     ├─ revoked_at (NULL = valid)                            │
│     ├─ expires_at (TTL)                                     │
│     ├─ device_info                                          │
│     ├─ ip                                                   │
│     └─ last_used_at                                         │
├─────────────────────────────────────────────────────────────┤
│            Redis (Token Revocation & Blacklist)             │
│└─ auth:refresh:blacklist:<hash> (TTL = remaining token life)│
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### User Table (PostgreSQL)

```
┌─────────────────────────────────────────┐
│            users                        │
├─────────────────────────────────────────┤
│ id: UUID (PK)                           │
│ email: VARCHAR(255) (UNIQUE, INDEXED)   │
│ password_hash: VARCHAR(255)             │
│ full_name: VARCHAR(255)                 │
│ role: ENUM (STUDENT|TEACHER|...)        │
│ status: ENUM (ACTIVE|INACTIVE|...)      │
│ created_at: TIMESTAMP                   │
│ updated_at: TIMESTAMP                   │
│ deleted_at: TIMESTAMP (soft delete)     │
│                                         │
│ relationships: [sessions]               │
└─────────────────────────────────────────┘
```

### Session Table (PostgreSQL)

```
┌──────────────────────────────────────────┐
│           user_sessions                  │
├──────────────────────────────────────────┤
│ id: UUID (PK)                            │
│ user_id: UUID (FK→users, INDEXED)        │
│ refresh_token_hash: VARCHAR(255)         │
│   (SHA256 hash, NEVER raw token)         │
│ revoked_at: TIMESTAMP (NULL = active)    │
│ last_used_at: TIMESTAMP (rotation time)  │
│ expires_at: TIMESTAMP (INDEXED)          │
│ device_info: TEXT                        │
│ ip: VARCHAR(45) (IPv6 support)           │
│ created_at: TIMESTAMP                    │
│                                          │
│ relationships: [user]                    │
└──────────────────────────────────────────┘
```

### Redis Blacklist

```
Key Format: auth:refresh:blacklist:<token_hash>
Value: "revoked" (placeholder)
TTL: Remaining session lifetime (seconds)

Example:
- Key: auth:refresh:blacklist:a1b2c3d4e5f6...
- Value: revoked
- TTL: 2592000 (30 days in seconds)
```

---

## Token Lifecycle

### Access Token (JWT - RS256)

```
┌─────────────────────────────┐
│     Access Token Payload    │
├─────────────────────────────┤
│ userId: string (UUID)       │
│ role: string (RBAC)         │
│ iat: number (issued at)     │
│ exp: number (expires at)    │
└─────────────────────────────┘
         ↓
  RS256 Signature
  (Private Key)
         ↓
┌─────────────────────────────┐
│   Signed JWT Token (15m)    │
├─────────────────────────────┤
│ Header.Payload.Signature    │
└─────────────────────────────┘
         ↓
Sent to Client (Authorization header)
Verified by Gateway (Public key)
```

### Refresh Token (Opaque)

```
Generate: crypto.randomBytes(32).toString('hex')
         ↓
┌──────────────────────────────┐
│  Raw Token (32 bytes hex)    │
│  "a1b2c3d4e5f6g7h8i9..."     │
└──────────────────────────────┘
         ↓
Hash with SHA256
         ↓
┌──────────────────────────────┐
│  Token Hash (stored in DB)   │
│  "a1b2c3d4e5f6g7h8..."       │
└──────────────────────────────┘
         ↓
Raw Token → HttpOnly Cookie
Hash → PostgreSQL (user_sessions.refresh_token_hash)
```

### Token Rotation on Refresh

```
Receive: Old Refresh Token (cookie)
         ↓
         ├─ Hash it → Lookup session ✓
         ├─ Check blacklist → Not blacklisted ✓
         ├─ Check expiration → Not expired ✓
         └─ Check revoked_at → NULL (active) ✓
         ↓
Generate:
    - New Refresh Token (opaque)
    - New Access Token (JWT RS256)
         ↓
Update Session:
    - refresh_token_hash: new hash
    - last_used_at: now()
    - expires_at: now + 30 days
         ↓
Blacklist Old Token:
    - redis: auth:refresh:blacklist:<old_hash>
    - TTL: remaining session life
         ↓
Return to Client:
    - Set cookie: new refresh token
    - Response body: new access token
         ↓
Next Refresh Attempt with Old Token
    ├─ Check blacklist → FOUND ✗
    └─ Reject: 401 Unauthorized
```

---

## Security Layers

### Layer 1: Password Storage

```
User enters password
         ↓
bcrypt.hash(password, 12 rounds)
         ↓
hashed_password (never same twice, cryptographically slow)
         ↓
Store in DB (password_hash column)
         ↓
Login attempt:
bcrypt.compare(input_password, stored_hash)
         ↓
Timing-safe comparison
```

### Layer 2: Access Token

```
RS256 (Asymmetric)
    ├─ Signed with Private Key (auth-service only)
    ├─ Verified with Public Key (gateway + any service)
    ├─ Cannot be forged without private key
    └─ Expires after 15 minutes
```

### Layer 3: Refresh Token Security

```
┌─ Never stored raw in database
├─ Stored as SHA256 hash
├─ Sent to client as HttpOnly cookie (prevents XSS)
├─ Rotates on every refresh (prevents replay)
├─ Immediately blacklisted when old (prevents reuse)
├─ SameSite=strict (prevents CSRF)
└─ Secure flag in production (HTTPS only)
```

### Layer 4: Session Tracking

```
Each session records:
    ├─ Device fingerprint (User-Agent)
    ├─ Client IP address
    ├─ Creation timestamp
    ├─ Last used timestamp
    └─ Revocation status (revoked_at)

Detection of compromise:
    ├─ Token reuse after rotation → Immediately rejected
    ├─ Same token from different IP → Potential breach
    └─ Revocation + blacklist → Prevents further use
```

### Layer 5: Account Status Check

```
Before authentication:
    └─ Check user.status = ACTIVE

Reject if:
    ├─ INACTIVE (account disabled)
    ├─ LOCKED (too many failed attempts)
    └─ BANNED (administrative action)
```

---

## Error Handling Strategy

### RFC 7807 Problem Details

```
┌─────────────────────────────────────┐
│     4xx/5xx Response                │
├─────────────────────────────────────┤
│ error: {                            │
│   type: "about:blank",              │
│   title: "Conflict",        ← HTTP │
│   status: 409,              ← Code │
│   detail: "Email already...",← Details
│   code: "EMAIL_EXISTS",     ← App │
│   errors: {...}             ← Field errors
│ }                                   │
└─────────────────────────────────────┘
```

### HTTP Status Codes

```
200 OK              → Login/Refresh/Logout success
201 Created         → Register success
400 Bad Request     → Validation failed (Zod errors)
401 Unauthorized    → Invalid credentials/expired token/missing session
403 Forbidden       → Account inactive/banned/locked
409 Conflict        → Email already exists
503 Unavailable     → DB/Redis offline
```

---

## Configuration Map

```
┌─────────────────────────────────────────┐
│        .env Variables                   │
├─────────────────────────────────────────┤
│ NODE_ENV              → Dev/Prod mode   │
│ PORT=3001             → Service port    │
│ DATABASE_URL          → Prisma connstr  │
│ REDIS_URL             → Redis connstr   │
│ JWT_PRIVATE_KEY       → RS256 private   │
│ JWT_PUBLIC_KEY        → RS256 public    │
│ ACCESS_TOKEN_TTL=15m  → Token lifetime  │
│ REFRESH_TOKEN_TTL_DAYS=30 → Session TTL │
│ BCRYPT_ROUNDS=12      → Hash iterations │
│ COOKIE_DOMAIN=local   → Cookie scope    │
│ COOKIE_SECURE=false   → HTTPS flag      │
│ LOG_LEVEL=info        → Pino level      │
└─────────────────────────────────────────┘
         ↓ (Validated & Loaded at Startup)
    src/config/env.ts
         ↓
    Accessible throughout app as `env` constant
```

---

## Deployment Architecture

```
Docker Compose
    ├─ PostgreSQL 16 (port 5432)
    │  ├─ Database: auth_db
    │  ├─ User: postgres
    │  └─ Persists to volume
    │
    ├─ Redis (port 6379)
    │  ├─ Token blacklist cache
    │  └─ Persists to volume
    │
    ├─ Auth Service (port 3001)
    │  ├─ TypeScript compiled → JS
    │  ├─ npm start (node dist/index.js)
    │  └─ Health checks: /health, /ready
    │
    └─ API Gateway (port 8081)
       ├─ JWT verification (public key)
       ├─ Routes requests to services
       └─ Exposes to external clients

Network: All services on internal docker network
         Client → Gateway → Auth Service
```

---

## Extensibility for Phase 3

### Ready-Made Integration Points

```
1. Middleware System
   └─ Can add rate limiting, audit logging, etc.

2. Error Handling
   └─ Centralized catch-all, easy to add custom errors

3. Database Models
   └─ Schema supports: phone_hash, subscription_id, org_id
   └─ Soft delete (deleted_at) already in place

4. Session Tracking
   └─ device_info + ip ready for multi-device detection
   └─ Can add fingerprinting for additional security

5. Validation System
   └─ Zod schemas extensible for new fields
   └─ Can add password complexity rules, email verification

6. Service Layer
   └─ Modular design allows new modules (email, SMS, OTP, etc.)
```
