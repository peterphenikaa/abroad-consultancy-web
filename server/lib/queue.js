const { Queue } = require('bullmq');
const redis = require('./redis');

const aiQueue = new Queue('ai-processing', {
  connection: redis.options,
});

module.exports = {
  aiQueue,
};
