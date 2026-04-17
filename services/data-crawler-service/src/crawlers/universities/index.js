const crawlUSUniversities = require("./us");
const crawlUKUniversities = require("./uk");
const crawlAUUniversities = require("./au");
const crawlCAUniversities = require("./ca");
const { delay } = require("../../utils/delay");

async function syncAllUniversitiesData() {
  console.log("\n=============================================");
  console.log("🎓 BẮT ĐẦU CRAWL DATA ĐẠI HỌC TỪ CÁC NGUỒN CHUẨN...");
  console.log("=============================================");

  const crawlers = [
    crawlUSUniversities,
    crawlUKUniversities,
    crawlAUUniversities,
    crawlCAUniversities,
  ];

  // Sử dụng cơ chế Sequential + Delay để tránh Rate Limit của các trang lớn.
  const results = [];

  for (const crawler of crawlers) {
    try {
      const data = await crawler();
      results.push({ status: "fulfilled", value: data });
    } catch (error) {
      results.push({ status: "rejected", reason: error.message });
    }

    // Nghỉ ngẫu nhiên 1 - 3 giây
    const waitTime = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
    console.log(`⏱️ Đang nghỉ ${waitTime}ms để tránh Rate Limit...`);
    await delay(waitTime);
  }

  const successfulData = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  console.log(
    `\n✅ Lấy thành công ${successfulData.length}/${crawlers.length} luồng dữ liệu Danh sách trường.`,
  );

  return successfulData;
}

module.exports = { syncAllUniversitiesData };
