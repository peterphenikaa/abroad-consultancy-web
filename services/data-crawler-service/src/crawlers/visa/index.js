const axios = require("axios");
const cheerio = require("cheerio");
const prisma = require("../../lib/prisma");
const { cleanText, cleanUrl } = require("../../utils/cleaner");

async function crawlRealVisaData() {
    const visaSources = [
        {
            countryId: "US",
            title: "US Student Visa (F/M)",
            url: "https://en.wikipedia.org/wiki/F_visa"
        },
        {
            countryId: "UK",
            title: "UK Student Visa",
            url: "https://en.wikipedia.org/wiki/Visa_policy_of_the_United_Kingdom"
        },
        {
            countryId: "AU",
            title: "AU Student Visa",
            url: "https://en.wikipedia.org/wiki/Visa_policy_of_Australia"
        },
        {
            countryId: "CA",
            title: "CA Student Visa",
            url: "https://en.wikipedia.org/wiki/Visa_policy_of_Canada"
        }
    ];

    const results = [];
    
    for (const source of visaSources) {
        try {
            console.log(`[Visa Crawler] Đang lấy dữ liệu thật từ: ${source.url}`);
            const response = await axios.get(source.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                }
            });
            const $ = cheerio.load(response.data);
            
            // Lấy nội dung các thẻ text p làm thông tin
            let paragraphs = [];
            $("p").each((i, el) => {
                const text = $(el).text();
                // Bỏ qua đoạn rác ngắn
                if (text.length > 50) {
                    paragraphs.push(text);
                }
            });
            
            // Ghép lại và LÀM SẠCH BẰNG FILE CLEANER (Transform data pipeline)
            const rawContent = paragraphs.slice(0, 10).join("\n"); 
            const cleanedContent = cleanText(rawContent);
            const cleanedUrl = cleanUrl(source.url);

            results.push({
                countryId: source.countryId,
                title: source.title,
                rawTextContent: cleanedContent,
                sourceUrl: cleanedUrl,
                crawledAt: new Date().toISOString()
            });
            console.log(`✅ Lấy và làm sạch xong dữ liệu cho: ${source.countryId}`);
        } catch (error) {
            console.error(`❌ Lỗi crawl Visa ${source.countryId}:`, error.message);
        }
    }

    return results;
}

async function syncAllVisaData() {
  console.log("\n=============================================");
  console.log("✈️ BẮT ĐẦU CRAWL DATA VISA (DỮ LIỆU THẬT & CLEANED)...");
  console.log("=============================================");

  let successfulData = [];
  try {
      successfulData = await crawlRealVisaData();
  } catch (error) {
      console.error("❌ Lỗi khi lấy dữ liệu Visa:", error.message);
  }

  if (successfulData.length > 0) {
    console.log("💾 Đang lưu dữ liệu bản gốc (Raw Visa) vào PostgreSQL (schema crawler)...");
    try {
      const saved = await prisma.rawVisaData.createMany({
        data: successfulData,
        skipDuplicates: true
      });
      console.log("✅ Đã lưu trữ thành công " + saved.count + " bản ghi Visa thật vào database.");
    } catch (dbError) {
      console.error("❌ Lỗi khi lưu dữ liệu Visa vào database:", dbError.message);
    }
  }

  return successfulData;
}

module.exports = { syncAllVisaData };
