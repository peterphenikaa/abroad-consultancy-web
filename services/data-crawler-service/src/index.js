const cron = require("node-cron");
const { syncAllVisaData } = require("./crawlers/visa");
const { syncAllUniversitiesData } = require("./crawlers/universities");

console.log("🚀 Data Crawler Service đang khởi động...");

// Test luồng cào
async function test() {
    await syncAllVisaData();
    // await syncAllUniversitiesData(); // Đã cào 2700 trường rồi nên tạm tắt
}

test();
