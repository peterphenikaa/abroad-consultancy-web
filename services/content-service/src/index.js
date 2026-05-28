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

// JWT auth middleware for all /api/v1 routes
const UUID_SEGMENT = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

app.use('/api/v1', createAuthMiddleware({
  publicPaths: [
    { path: '/courses', methods: ['GET'], exact: true },
    { regex: `^/courses/${UUID_SEGMENT}$`, methods: ['GET'] },
    { regex: `^/courses/${UUID_SEGMENT}/access$`, methods: ['GET'] },
    { path: '/contents', methods: ['GET'] },
    { regex: `^/contents/${UUID_SEGMENT}$`, methods: ['GET'] },
    { path: '/lessons', methods: ['GET'] },
    { regex: `^/lessons/${UUID_SEGMENT}$`, methods: ['GET'] },
    { path: '/categories', methods: ['GET'], exact: true },
  ],
}));

app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/contents', contentRoutes);
app.use('/api/v1/skill-tags', skillTagRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Content Service đang chạy trên: http://localhost:${PORT}`);
});