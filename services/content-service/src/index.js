const express = require('express');
const courseRoutes = require('./routes/courseRoute');
const moduleRoutes = require('./routes/moduleRoute');
const contentRoutes = require('./routes/contentRoute');
const lessonRoutes = require('./routes/lessonRoute');

require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/contents', contentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Content Service đang chạy trên: http://localhost:${PORT}`);
});