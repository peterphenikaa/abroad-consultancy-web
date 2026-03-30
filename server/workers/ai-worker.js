const { Worker } = require('bullmq');
const redis = require('../lib/redis');
const prisma = require('../lib/prisma');

const aiWorker = new Worker(
  'ai-processing',
  async (job) => {
    console.log(`Processing AI job: ${job.id}`);
    const { userId, query } = job.data;

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const responseText = `AI Response to "${query}" for user ${userId}`;

    // Update Database using Prisma
    try {
      await prisma.aIInteraction.create({
        data: {
          userId,
          prompt: query,
          response: responseText,
        },
      });
    } catch (error) {
      console.error('Error saving to Prisma:', error);
      throw error;
    }

    return { result: responseText };
  },
  {
    connection: redis.options,
  }
);

aiWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed! Content:`, job.returnvalue);
});

aiWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

module.exports = aiWorker;
