const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
const express = require("express");
const cors = require("cors");
const { Pinecone } = require("@pinecone-database/pinecone");
const { Pool } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const pgPool = new Pool({ connectionString: process.env.CRAWLER_DATABASE_URL });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.Index("do-an-lien-nganh");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

app.post("/api/sync-rag", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(
      "🔄 Bắt đầu nạp " +
        limit +
        " bản ghi vào Pinecone (Vector Embeddings)...",
    );

    const { rows: universities } = await pgPool.query(
      "SELECT * FROM crawler.raw_university_data LIMIT $1",
      [limit],
    );

    const vectors = [];

    for (let i = 0; i < universities.length; i++) {
      const uni = universities[i];

      const textContent =
        "Đại học: " +
        uni.universityName +
        ". Địa điểm: " +
        uni.location +
        ". Giới thiệu: " +
        uni.description;

      const embeddingModel = genAI.getGenerativeModel({
        model: "gemini-embedding-001",
      });

      const result = await genAI
        .getGenerativeModel({ model: "text-embedding-004" })
        .embedContent(textContent)
        .catch(async (e) => {
          return await genAI
            .getGenerativeModel(
              { model: "text-embedding-004" },
              { apiVersion: "v1beta" },
            )
            .embedContent(textContent)
            .catch(async (e2) => {
              return await genAI
                .getGenerativeModel(
                  { model: "text-embedding-004" },
                  { apiVersion: "v1" },
                )
                .embedContent(textContent)
                .catch(async (e3) => {
                  const r = await genAI
                    .getGenerativeModel({ model: "gemini-embedding-001" })
                    .embedContent(textContent);
                  return r;
                });
            });
        });

      const embeddingInfo = result.embedding;

      let vectorValues = embeddingInfo.values;
      if (!Array.isArray(vectorValues)) {
        vectorValues = Object.values(vectorValues);
      }

      if (vectorValues.length > 768) {
        vectorValues = vectorValues.slice(0, 768);
      }

      vectors.push({
        id: "uni_" + uni.id,
        values: vectorValues,
        metadata: {
          type: "university",
          title: uni.universityName,
          location: uni.location,
          url: uni.sourceUrl || "",
        },
      });

      console.log("✅ Đã Embedding xong trường: " + uni.universityName);
      await delay(2000);
    }

    if (vectors.length > 0) {
      console.log("⏳ Đang lưu lô Vectors vào Pinecone DB...");
      const mappedVectors = vectors.map((v) => ({
        id: String(v.id),
        values: Array.from(v.values),
        metadata: v.metadata,
      }));
      try {
        await pineconeIndex.upsert(mappedVectors);
      } catch (e) {
        if (e.message.includes("Must pass in at least 1 record to upsert.")) {
          await pineconeIndex.upsert({ records: mappedVectors });
        } else {
          throw e;
        }
      }
      console.log(
        "🚀 Đã lưu thành công " +
          vectors.length +
          " trường học lên Pinecone Vector Database!",
      );
    }

    res.json({
      message: "Hoàn tất Embeddings & Sync vào Pinecone",
      count: vectors.length,
    });
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "Thiếu câu hỏi question" });

    const result = await genAI
      .getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(question)
      .catch(async (e) => {
        return await genAI
          .getGenerativeModel({ model: "gemini-embedding-001" })
          .embedContent(question);
      });

    let qEmbedVals = result.embedding.values;
    if (!Array.isArray(qEmbedVals)) {
      qEmbedVals = Object.values(qEmbedVals);
    }
    if (qEmbedVals.length > 768) {
      qEmbedVals = qEmbedVals.slice(0, 768);
    }

    const searchRes = await pineconeIndex.query({
      vector: qEmbedVals,
      topK: 3,
      includeMetadata: true,
    });

    const contexts = searchRes.matches
      .map((m) => m.metadata.title + " (Ở " + m.metadata.location + ")")
      .join("; ");
    const sysPrompt =
      "Bạn là một AI Tư vấn Du học. Dựa vào thông tin trường đại học sau: [ " +
      contexts +
      " ]. Hãy trả lời câu hỏi của học sinh: " +
      question;

    const chatModelCandidates = [
      { model: "gemini-2.5-flash", apiVersion: "v1beta" },
      { model: "gemini-2.0-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash", apiVersion: "v1" },
    ];

    let finalAnswer = null;
    let lastChatError = null;

    for (const candidate of chatModelCandidates) {
      try {
        const chatModel = genAI.getGenerativeModel(
          { model: candidate.model },
          { apiVersion: candidate.apiVersion },
        );
        finalAnswer = await chatModel.generateContent(sysPrompt);
        lastChatError = null;
        break;
      } catch (chatError) {
        lastChatError = chatError;
        console.warn(
          "⚠️ Chat model failed:",
          candidate.model,
          chatError.message,
        );
      }
    }

    if (!finalAnswer) {
      return res.json({
        ai_answer:
          "Hiện tại hệ thống AI đang quá tải hoặc quota của model Gemini đã hết. Bạn hãy thử lại sau vài phút, hoặc dùng API key / project khác có quota hợp lệ.",
        reference_sources: searchRes.matches.map((m) => m.metadata.title),
        ai_error: lastChatError?.message || "Gemini model unavailable",
      });
    }

    res.json({
      ai_answer: finalAnswer.response.text(),
      reference_sources: searchRes.matches.map((m) => m.metadata.title),
    });
  } catch (err) {
    console.error("Lỗi chat:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(
    "🚀 AI RAG Service (Pinecone + Gemini AI) đang chạy tại port " + PORT,
  );
});
