const crawlUSVisa = require('./us');
const crawlAuVisa = require('./au');
const crawlUkVisa = require('./uk');
const crawlCaVisa = require('./ca');

/**
 * Multi-source Aggregator
 * Điều phối gọi toàn bộ các crawler của các quốc gia, gom dữ liệu
 * trả về chuẩn để pipeline ETL bắn vào Pinecone (Vector DB)
 */
async function syncAllVisaData() {
    console.log("\n=============================================");
    console.log("🌐 BẮT ĐẦU CRAWL DATA VISA TỪ CÁC CHÍNH PHỦ...");
    console.log("=============================================");

    try {
        // Chạy song song (Concurrent) cả 4 crawler để tối ưu tốc độ
        const results = await Promise.all([
            crawlUSVisa(),
            crawlAuVisa(),
            crawlUkVisa(),
            crawlCaVisa()
        ]);

        console.log("\n✅ CRAWL DATA VISA HOÀN TẤT. KẾT QUẢ GOM ĐƯỢC:");
        console.log(JSON.stringify(results, null, 2));

        // TODO: Chỗ này sau này sẽ đẩy mảng `results` (mỗi phần tử chứa rawTextContent) vào PostgreSQL
        // Hoặc ném thẳng vào Kafka messages để AI RAG Service nhận lấy và tạo Embeddings Pinecone.

        return results;
    } catch (error) {
        console.error("❌ Lỗi trong quá trình tổng hợp (Aggregate) dữ liệu Visa:", error.message);
        throw error;
    }
}

module.exports = { syncAllVisaData };
