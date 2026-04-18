const { importRealUniversities } = require("./import-real-data");

async function syncAllUniversitiesData() {
  console.log("\n=============================================");
  console.log("🎓 BẮT ĐẦU CRAWL DATA ĐẠI HỌC TỪ GLOBAL API...");
  console.log("=============================================");

  try {
    const data = await importRealUniversities();
    return data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu University:", error.message);
    return [];
  }
}
module.exports = { syncAllUniversitiesData };
