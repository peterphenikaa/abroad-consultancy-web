const { MongoClient } = require("mongodb");
const { Pinecone } = require("@pinecone-database/pinecone");
const { Kafka } = require("kafkajs");

async function testConnections() {
  console.log("--- AI-RAG SERVICE CONNECTION TEST ---");
  try {
    const client = new MongoClient(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB (Atlas) connected!");
    await client.close();
  } catch (e) {
    console.error("❌ MongoDB (Atlas) failed:", e.message);
  }

  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexList = await pc.listIndexes();
    console.log(
      "✅ Pinecone connected! Indexes:",
      indexList.indexes ? indexList.indexes.map((i) => i.name) : [],
    );
  } catch (e) {
    console.error("❌ Pinecone failed:", e.message);
  }

  try {
    const kafka = new Kafka({
      clientId: "ai-rag-service",
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
