const axios = require('axios');
const cheerio = require('cheerio');

async function crawlUkVisa() {
    const url = "https://www.gov.uk/student-visa";
    console.log(`🇬🇧 Đang crawl dữ liệu UK Visa từ: ${url}`);
    
    return {
        countryId: "UK",
        title: "Student visa",
        rawTextContent: "You can apply for a Student visa to study in the UK if you are 16 or over. You must have been offered a place on a course by a licensed student sponsor... [Đoạn text bóc tách từ gov.uk sẽ nằm ở đây]",
        sourceUrl: url,
        crawledAt: new Date().toISOString()
    };
}

module.exports = crawlUkVisa;
