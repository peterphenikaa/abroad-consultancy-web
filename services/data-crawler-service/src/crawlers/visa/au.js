const axios = require('axios');
const cheerio = require('cheerio');

async function crawlAuVisa() {
    const url = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500";
    console.log(`🇦🇺 Đang crawl dữ liệu AU Visa từ: ${url}`);
    
    return {
        countryId: "AU",
        title: "Student visa (subclass 500)",
        rawTextContent: "This visa allows you to stay in Australia to study full-time in a recognised education institution. You must have sufficient funds to cover your travel, tuition and living expenses... [Đoạn text bóc tách từ immi.homeaffairs.gov.au sẽ nằm ở đây]",
        sourceUrl: url,
        crawledAt: new Date().toISOString()
    };
}

module.exports = crawlAuVisa;
