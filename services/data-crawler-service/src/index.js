const cron = require("node-cron");
const { syncAllVisaData } = require("./crawlers/visa");
const { syncAllUniversitiesData } = require("./crawlers/universities");

console.log("🚀 Data Crawler Service đang khởi động...");
console.log("⏳ Lên lịch (Cronjob) tự động cào dữ liệu...");

// Test luồng cào Đại Học thay vì dùng EasyUni cũ
// syncAllUniversitiesData();

/**
 * Thiết lập Cronjob chạy định kỳ:
 * Công thức: Phút - Giờ - Ngày trong tháng - Tháng - Ngày trong tuần
 *  "0 0 * * *" = Chạy vào đúng 00:00 (12h đêm) mỗi ngày.
 *  "*/5 * * * * *" = Chạy mỗi 5 giây (để test).
 */
cron.schedule("0 0 * * *", async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] Bắt đầu tiến trình chạy định kỳ (12h đêm hàng ngày)...`);
    
    // 1. Tiến trình thu thập (Multi-source Aggregator) từ các trang Chính phủ
    await syncAllVisaData();

    // 2. Tiến trình thu thập trường Đại Học (Từ EduUSA, UCAS...)
    await syncAllUniversitiesData();
    
    // 3. TODO: Gọi hàm crawl tin tức/học bổng
    // await syncAllScholarshipsData();


    console.log("✅ Hoàn thành toàn bộ tiến trình cron.");
});

// Giữ cho process Node.js không bị tắt
process.on('SIGINT', () => {
    console.log("\n❌ Đang tắt Crawler Service...");
    process.exit();
});
