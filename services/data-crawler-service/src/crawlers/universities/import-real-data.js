const axios = require("axios");
const prisma = require("../../lib/prisma");
const { cleanText, cleanUrl } = require("../../utils/cleaner");

async function importRealUniversities() {
  console.log(
    "🚀 [REAL DATA CRAWLER] Đang kết nối tới Global Universities API...",
  );

  // API chứa danh sách trường đại học thật trên toàn thế giới
  const apiURL = "http://universities.hipolabs.com/search";

  const targetCountries = [
    { name: "United States", code: "US" },
    { name: "United Kingdom", code: "UK" },
    { name: "Australia", code: "AU" },
    { name: "Canada", code: "CA" },
  ];

  let totalSaved = 0;

  for (const country of targetCountries) {
    try {
      console.log(
        `\n⏳ Đang lấy dữ liệu toàn bộ trường tại: ${country.name}...`,
      );
      // Kết nối lấy JSON Data.
      const response = await axios.get(
        `${apiURL}?country=${encodeURIComponent(country.name)}`,
      );
      const universities = response.data;

      console.log(
        `✅ Tìm thấy ${universities.length} trường ở ${country.name}. Tiến hành chuẩn hóa và lưu DB...`,
      );

      // Chuẩn hóa dữ liệu theo Schema của chúng ta
      const formattedData = universities.map((uni) => ({
        countryId: country.code,
        source: "GlobalUniversitiesOpenAPI",
        universityName: cleanText(uni.name),
        location: cleanText(uni["state-province"]
          ? `${uni["state-province"]}, ${country.name}`
          : country.name),
        website:
          uni.web_pages && uni.web_pages.length > 0 ? cleanUrl(uni.web_pages[0]) : null,
        description: cleanText(`Thông tin được cung cấp từ mạng lưới giáo dục ${country.name}. Domain quốc tế chính: ${uni.domains && uni.domains.length > 0 ? uni.domains[0] : "N/A"}`),
        sourceUrl:
          uni.web_pages && uni.web_pages.length > 0 ? cleanUrl(uni.web_pages[0]) : cleanUrl(apiURL), // Nếu không có Web thì lấy nguồn API
        rawJson: uni,
      }));

      // Bulk Insert vào Postgres
      const saved = await prisma.rawUniversityData.createMany({
        data: formattedData,
        skipDuplicates: true, // Prisma sẽ báo lỗi bỏ qua nếu ID trùng (mặc dù ta xài UUID auto gen)
      });

      console.log(`✅ Đã cắm vào Database thành công: ${saved.count} trường.`);
      totalSaved += saved.count;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy data ở ${country.name}:`, error.message);
    }
  }

  console.log(
    `\n🎉🎉🎉 HOÀN THẤT! Tổng cộng đã đổ ${totalSaved} dòng dữ liệu TRƯỜNG ĐẠI HỌC THẬT vào Supabase!`,
  );
  await prisma.$disconnect();
}

// Chạy script
module.exports = { importRealUniversities };
