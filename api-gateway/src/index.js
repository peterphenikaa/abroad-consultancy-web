require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const { createClient } = require("redis");
const { rateLimit } = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const jwt = require("jsonwebtoken");
const helmet = require("helmet");

if (!process.env.JWT_SECRET && !process.env.JWT_PUBLIC_KEY) {
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

const authenticateJWT = (req, res, next) => {
  const publicRoutes = new Set([
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/health",
  ]);

  if (publicRoutes.has(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    // Support both HS256 (JWT_SECRET) and RS256 (JWT_PUBLIC_KEY)
    const verifyOptions = process.env.JWT_PUBLIC_KEY
      ? { algorithms: ["RS256"] }
      : {};
    const secret = process.env.JWT_PUBLIC_KEY || process.env.JWT_SECRET;

    jwt.verify(token, secret, verifyOptions, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }
      req.headers["x-user-id"] = user.id || user.userId;
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
  "/api/auth": process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
  "/api/users": process.env.USER_SERVICE_URL || "http://user-service:3002",
  "/api/ai": process.env.AI_SERVICE_URL || "http://ai-rag-service:3003",
  "/api/content":
    process.env.CONTENT_SERVICE_URL || "http://content-service:3004",
  "/api/exams": process.env.EXAM_SERVICE_URL || "http://exam-service:3005",
  "/api/quizzes": process.env.QUIZ_SERVICE_URL || "http://quiz-service:3006",
  "/api/search": process.env.SEARCH_SERVICE_URL || "http://search-service:3007",
  "/api/payments":
    process.env.PAYMENT_SERVICE_URL || "http://payment-service:3008",
  "/api/notifications":
    process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3009",
  "/api/analytics":
    process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3010",
};

for (const [path, target] of Object.entries(routes)) {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      proxyTimeout: 5000,
      timeout: 5000,
      pathRewrite: {
        [`^${path}`]: "",
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
  console.log(`===============================================`);
});
