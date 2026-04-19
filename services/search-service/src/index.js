const path = require("path");
// Lấy đúng file .env ở thư mục gốc của project (lùi 3 cấp)
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const express = require("express");
const cors = require("cors");
// Bonsai (trong ảnh) dùng OpenSearch v2.19.4 thay vì Elasticsearch thuần,
// nên dùng Client của OpenSearch để tương thích mà API vẫn y hệt.
const { Client } = require("@opensearch-project/opensearch");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Kết nối PostgreSQL (Sử dụng đúng CRAWLER_DATABASE_URL theo file .env)
const pgPool = new Pool({
  connectionString: process.env.CRAWLER_DATABASE_URL,
});

// 2. Kết nối Elasticsearch (Sử dụng đúng ELASTICSEARCH_NODE theo file .env)
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE,
});

// Endpoint chạy đồng bộ dữ liệu thủ công từ Schema Crawler sang Elasticsearch
app.post("/api/sync", async (req, res) => {
  try {
    console.log("🔄 Bắt đầu đồng bộ PostgreSQL -> Elasticsearch...");

    // 1. Lấy dữ liệu từ Database (Bảng chứa Data thật)
    const { rows: universities } = await pgPool.query(
      "SELECT * FROM crawler.raw_university_data",
    );
    const { rows: visas } = await pgPool.query(
      "SELECT * FROM crawler.raw_visa_data",
    );

    // 2. Tạo Index nêú chưa có
    const indexName = "study_abroad_data";
    const indexExists = await esClient.indices.exists({ index: indexName });
    if (!indexExists) {
      await esClient.indices.create({ index: indexName });
    }

    // 3. Chuẩn bị Bulk data
    const operations = [];

    universities.forEach((uni) => {
      operations.push({ index: { _index: indexName, _id: "uni_" + uni.id } });
      operations.push({
        type: "university",
        title: uni.universityName,
        location: uni.location,
        content: uni.description,
        url: uni.sourceUrl,
        countryId: uni.countryId,
      });
    });

    visas.forEach((visa) => {
      operations.push({ index: { _index: indexName, _id: "visa_" + visa.id } });
      operations.push({
        type: "visa",
        title: visa.title,
        location: null,
        content: visa.rawTextContent,
        url: visa.sourceUrl,
        countryId: visa.countryId,
      });
    });

    if (operations.length > 0) {
      // 4. Đẩy Bulk lô lớn vào Elasticsearch / OpenSearch
      // Lưu ý: với OpenSearch client mới, ta phải dùng tham số là { body: operations }
      const bulkResponse = await esClient.bulk({
        refresh: true,
        body: operations,
      });

      if (bulkResponse.errors) {
        console.error("❌ Có lỗi trong quá trình bulk insert");
        return res.status(500).json({ error: "Bulk insert có lỗi" });
      }

      console.log(
        "✅ Đã đồng bộ " +
          universities.length +
          " trường và " +
          visas.length +
          " visa lên Elasticsearch!",
      );
      return res.json({
        message: "Đồng bộ thành công!",
        count: universities.length + visas.length,
      });
    }

    res.json({ message: "Không có dữ liệu để đồng bộ" });
  } catch (error) {
    console.error("❌ Lỗi đồng bộ:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Tìm kiếm Full-Text siêu tốc
app.get("/api/search", async (req, res) => {
  try {
    // Khách hàng gõ tìm kiếm
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Thiếu query q" });

    const result = await esClient.search({
      index: "study_abroad_data",
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ["title^3", "content", "location"], // Ưu tiên match Tên trường/loại Visa x3 lần
          },
        },
      },
    });

    // OpenSearch client thường trả về object cấu trúc: { body: { hits: ... } }
    const hits = result.body.hits.hits.map((h) => ({
      score: h._score,
      data: h._source,
    }));

    res.json({ results: hits });
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3007; // Cổng chuẩn của search-service theo README
app.listen(PORT, () => {
  console.log("🚀 Search Service (Elasticsearch) đang chạy tại port " + PORT);
});
