const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { aiQueue } = require('./lib/queue');
const aiWorker = require('./workers/ai-worker');
const supabase = require('./lib/supabase');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/ai/process', async (req, res) => {
  try {
    const { userId, query } = req.body;

    if (!userId || !query) {
      return res.status(400).json({ error: 'Missing userId or query' });
    }

    const job = await aiQueue.add('ai-processing-job', {
      userId,
      query,
    });

    res.status(202).json({
      message: 'AI processing job added to queue',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error adding AI job to queue:', error);
    res.status(500).json({ error: 'Failed to process AI task' });
  }
});

app.get('/api/ai/interactions', async (req, res) => {
  try {
    const data = await prisma.aIInteraction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching interactions from Prisma:', error);
    res.status(500).json({ error: 'Failed to fetch AI interactions' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
