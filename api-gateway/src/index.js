require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const { createClient } = require("redis");
const { rateLimit } = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const http = require("http");

// Import Swagger module
const { mergeOpenAPISpecs, registerSwaggerRoutes } = require("./swagger");

/** Cho phép JWT_PUBLIC_KEY=@relative/path hoặc đường dẫn tuyệt đối (khớp auth-service). */
function resolvePemFromEnv(varName) {
  const raw = process.env[varName];
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.startsWith("@")) {
    const rel = trimmed.slice(1);
    const full = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
    return fs.readFileSync(full, "utf8");
  }
  return trimmed;
}

const jwtPublicKeyPem = resolvePemFromEnv("JWT_PUBLIC_KEY");

if (!process.env.JWT_SECRET && !jwtPublicKeyPem) {
  throw new Error("FATAL ERROR: Either JWT_SECRET or JWT_PUBLIC_KEY is required in .env file");
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());

app.use((req, _res, next) => {
  console.log(`[Gateway] ${req.method} ${req.url}`);
  next();
});

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});

redisClient.on("error", (err) => console.error("[Redis Error]:", err));
redisClient.on("connect", () =>
  console.log("[Redis] Connected successfully ⚡"),
);

redisClient
  .connect()
  .catch((err) => console.error("[Redis] Kết nối ban đầu thất bại:", err));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  message: {
    success: false,
    message: "Gửi quá nhiều yêu cầu, vui lòng thử lại sau",
  },
});

app.use("/api", limiter);

/** req.path đôi khi có trailing slash; so khớp route công khai cho ổn định */
function gatewayPath(req) {
  const p = req.path || req.url?.split("?")[0] || "";
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

const authenticateJWT = (req, res, next) => {
  const pathKey = gatewayPath(req);
  const publicRoutes = new Set([
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/auth/verify-email",
    "/api/auth/forgot-password",
    "/api/auth/reset-password/verify-otp",
    "/api/auth/reset-password",
    "/api/ai/chat",
    "/api/payments/webhook",
    "/api/payments/health",
    "/api/payments/vnpay/return",
    "/api/payments/vnpay/ipn",
    "/health",
    "/docs",
    "/swagger.json",
  ]);

  if (publicRoutes.has(pathKey) || pathKey.startsWith("/api/v1/")) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const verifyOptions = jwtPublicKeyPem ? { algorithms: ["RS256"] } : {};
    const secret = jwtPublicKeyPem || process.env.JWT_SECRET;

    jwt.verify(token, secret, verifyOptions, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }
      req.headers["x-user-id"] = user.sub || user.id || user.userId;
      next();
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Không tìm thấy mã Token xác thực (Unauthorized)",
    });
  }
};

app.use(authenticateJWT);

const routes = {
  "/api/auth": {
    target: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
    servicePrefix: "/api/auth",
  },
  "/api/users": {
    target: process.env.USER_SERVICE_URL || "http://user-service:3002",
    servicePrefix: "/api/users",
  },
  "/api/ai": {
    target: process.env.AI_SERVICE_URL || "http://ai-rag-service:3003",
    servicePrefix: "/api",          
  },
  "/api/content": {
    target: process.env.CONTENT_SERVICE_URL || "http://content-service:3000",
    servicePrefix: "/api/content",
  },
  "/api/v1/courses": {
    target: process.env.CONTENT_SERVICE_URL || "http://content-service:3000",
    servicePrefix: "/api/v1/courses",
  },
  "/api/v1/lessons": {
    target: process.env.CONTENT_SERVICE_URL || "http://content-service:3000",
    servicePrefix: "/api/v1/lessons",
  },
  "/api/v1/modules": {
    target: process.env.CONTENT_SERVICE_URL || "http://content-service:3000",
    servicePrefix: "/api/v1/modules",
  },
  "/api/v1/contents": {
    target: process.env.CONTENT_SERVICE_URL || "http://content-service:3000",
    servicePrefix: "/api/v1/contents",
  },
  "/api/exams": {
    target: process.env.EXAM_SERVICE_URL || "http://exam-service:3005",
    servicePrefix: "/api/exams",
  },
  "/api/quizzes": {
    target: process.env.QUIZ_SERVICE_URL || "http://quiz-service:3006",
    servicePrefix: "/api/quizzes",
  },
  "/api/search": {
    target: process.env.SEARCH_SERVICE_URL || "http://search-service:3007",
    servicePrefix: "/api/search",
  },
  "/api/payments": {
    target: process.env.PAYMENT_SERVICE_URL || "http://payment-service:3008",
    servicePrefix: "/api/payments",
  },
  "/api/notifications": {
    target: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3009",
    servicePrefix: "/api/notifications",
  },
  "/api/analytics": {
    target: process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3010",
    servicePrefix: "/api/analytics",
  },
};

// ==================== SWAGGER SETUP ====================
const consolidatedSpec = mergeOpenAPISpecs();
registerSwaggerRoutes(app, consolidatedSpec);

for (const [gatewayPrefix, { target, servicePrefix }] of Object.entries(routes)) {
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathFilter: gatewayPrefix,
      proxyTimeout: 60000,
      timeout: 60000,
      pathRewrite: {
        [`^${gatewayPrefix}`]: servicePrefix, 
      },
      onProxyReq: (proxyReq, req) => {
        if (req.headers["x-user-id"]) {
          proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
        }
      },
      onError: (err, _req, res) => {
        console.error(
          `[Gateway Error] Proxy to ${target} failed:`,
          err.message,
        );
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: "Service is temporarily down or restarting",
          });
        }
      },
    }),
  );
}

app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "API Gateway is ready to route 🚀" });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔗 Routes mapped: ${Object.keys(routes).length} microservices`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`📋 OpenAPI JSON: http://localhost:${PORT}/swagger.json`);
  console.log(`📋 OpenAPI YAML: http://localhost:${PORT}/swagger.yaml`);
  console.log(`===============================================`);
});
