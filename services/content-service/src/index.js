const { Client } = require("pg");
const { Client: OpenSearchClient } = require("@opensearch-project/opensearch");
const Minio = require("minio");
const { Kafka } = require("kafkajs");

async function testConnections() {
  console.log("--- CONTENT SERVICE CONNECTION TEST ---");
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
    const osClient = new OpenSearchClient({
      node: process.env.ELASTICSEARCH_NODE,
    });
    const info = await osClient.info();
    console.log(
      "✅ OpenSearch (Bonsai) connected! Cluster:",
      info.body.cluster_name,
    );
  } catch (e) {
    console.error("❌ OpenSearch (Bonsai) failed:", e.message);
  }

  try {
    const minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "minio",
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || "admin",
      secretKey: process.env.MINIO_SECRET_KEY || "password123",
    });
    await minioClient.listBuckets();
    console.log("✅ Minio (Local S3) connected!");
  } catch (e) {
    console.error("❌ Minio failed:", e.message);
  }

  try {
    const kafka = new Kafka({
      clientId: "content-service",
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
