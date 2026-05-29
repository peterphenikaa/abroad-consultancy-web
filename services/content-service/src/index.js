const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const courseRoutes = require('./routes/courseRoute');
const moduleRoutes = require('./routes/moduleRoute');
const contentRoutes = require('./routes/contentRoute');
const lessonRoutes = require('./routes/lessonRoute');
const skillTagRoutes = require('./routes/skillTagRoute');
const { createAuthMiddleware } = require('@cambridge/shared');

require('dotenv').config();

const app = express();
app.use(express.json());

// Setup Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
app.use('/content-service-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Public: catalog, access check, và webhook ghi danh sau thanh toán (verify secret trong controller)
function isPublicV1Path(req) {
  if (req.method === 'POST' && /^\/courses\/[^/]+\/enroll-from-payment$/.test(req.path)) {
    return true;
  }
  if (req.method !== 'GET') return false;
  if (req.path === '/courses') return true;
  if (/^\/courses\/[^/]+\/access$/.test(req.path)) return true;
  if (req.path === '/categories' || req.path.startsWith('/categories/')) return true;
  return false;
}

const requireAuth = createAuthMiddleware({ publicPaths: [] });
app.use('/api/v1', (req, res, next) => {
  if (isPublicV1Path(req)) return next();
  return requireAuth(req, res, next);
});

app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/contents', contentRoutes);
app.use('/api/v1/skill-tags', skillTagRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Content Service đang chạy trên: http://localhost:${PORT}`);
});