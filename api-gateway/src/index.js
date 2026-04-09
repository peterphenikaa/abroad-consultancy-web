require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

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
      pathRewrite: {
        [`^${path}`]: "",
      },
      onError: (err, _req, res) => {
        console.error(
          `[Gateway Error] Proxy to ${target} failed:`,
          err.message,
        );
        res.status(502).json({
          success: false,
          message: "Service is temporarily down or restarting",
        });
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
