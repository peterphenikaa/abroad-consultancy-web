const { Client } = require("pg");
const { Kafka } = require("kafkajs");

async function testConnections() {
  console.log("--- USER SERVICE CONNECTION TEST ---");
  try {
    const pgClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pgClient.connect();
    console.log("✅ Postgres DB (pg) connected!");
    await pgClient.end();
  } catch (e) {
    console.error("❌ Postgres DB (pg) failed:", e.message);
  }

  try {
    const kafka = new Kafka({
      clientId: "user-service",
      brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
    });
    const admin = kafka.admin();
    await admin.connect();
    console.log("✅ Kafka connected!");
    await admin.disconnect();
  } catch (e) {
    console.error("❌ Kafka failed:", e.message);
  }

  // Keep it alive
  setInterval(() => {}, 1000 * 60 * 60);
}

testConnections();
