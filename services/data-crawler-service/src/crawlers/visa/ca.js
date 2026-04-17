const axios = require('axios');
const cheerio = require('cheerio');

async function crawlCaVisa() {
    const url = "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html";
    console.log(`🇨🇦 Đang crawl dữ liệu CA Visa từ: ${url}`);
    
    return {
        countryId: "CA",
        title: "Study permit: About the process",
        rawTextContent: "A study permit is a document we issue that allows foreign nationals to study at designated learning institutions (DLI) in Canada... [Đoạn text bóc tách từ canada.ca sẽ nằm ở đây]",
        sourceUrl: url,
        crawledAt: new Date().toISOString()
    };
}

module.exports = crawlCaVisa;
