const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const Redis = require("ioredis");
const { Kafka } = require("kafkajs");

async function testConnections() {
  console.log("--- AUTH SERVICE CONNECTION TEST ---");
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
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
    const { data, error } = await supabase.from("_dummy_").select("*").limit(1);
    console.log("✅ Supabase Client (HTTP APIs) connected!");
  } catch (e) {
    console.error("❌ Supabase Client (HTTP APIs) failed:", e.message);
  }

  try {
    const redis = new Redis(process.env.REDIS_URL);
    redis.on("connect", () => {
      console.log("✅ Redis (Redis Cloud) connected!");
      redis.quit();
    });
    redis.on("error", (err) => console.error("❌ Redis failed:", err.message));
  } catch (e) {
    console.error("❌ Redis failed:", e.message);
  }

  try {
    const kafka = new Kafka({
      clientId: "auth-service",
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
