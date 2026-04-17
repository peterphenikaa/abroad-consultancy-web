const axios = require('axios');
const cheerio = require('cheerio');

async function crawl() {
    const targetUrl = "https://www.ucas.com/";
    console.log(`🏫 [UK] Đang fetch (cào): ${targetUrl}`);
    try {
        const response = await axios.get(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const title = $('title').text().replace(/\s+/g, ' ').trim();
        const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim() || 'NO_H1';

        console.log(`✅ [UK] Success! Title: "${title}"`);
        
        return {
            countryId: "UK",
            source: "UCAS",
            pageTitle: title,
            primaryHeading: h1,
            sourceUrl: targetUrl,
            crawledAt: new Date().toISOString()
        };
    } catch (e) {
        console.error(`❌ [UK] Thất bại: ${e.message}`);
        return { countryId: "UK", error: e.message };
    }
}
module.exports = crawl;