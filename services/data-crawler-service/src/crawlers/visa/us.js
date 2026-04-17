const axios = require('axios');
const cheerio = require('cheerio');

async function crawlUSVisa() {
    const url = "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html";
    console.log(`🇺🇸 Đang crawl dữ liệu US Visa từ: ${url}`);
    
    // Giai đoạn hiện tại (Mock/Setup pipeline): Trả về Interface chuẩn
    // Giai đoạn sau: Dùng Puppeteer hoặc Axios + Cheerio bóc tách đúng thẻ <div class="tsg-rwd-main-copy">
    return {
        countryId: "US",
        title: "Student Visa (F-1/M-1)",
        rawTextContent: "To study in the United States, you must have a student visa (F or M). Your course of study and the type of school you plan to attend determine whether you need an F visa or an M visa... [Đoạn text bóc tách từ travel.state.gov sẽ nằm ở đây]",
        sourceUrl: url,
        crawledAt: new Date().toISOString()
    };
}

module.exports = crawlUSVisa;
