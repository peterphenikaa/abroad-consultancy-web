const express = require('express');
const courseRoutes = require('./routes/courseRoute');
const moduleRoutes = require('./routes/moduleRoute');
const contentRoutes = require('./routes/contentRoute');
const lessonRoutes = require('./routes/lessonRoute');
const skillTagRoutes = require('./routes/skillTagRoute');
const { createAuthMiddleware } = require('@cambridge/shared');

require('dotenv').config();

const app = express();
app.use(express.json());

// JWT auth middleware for all /api/v1 routes
app.use('/api/v1', createAuthMiddleware({
  publicPaths: ['/courses', '/categories'],
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