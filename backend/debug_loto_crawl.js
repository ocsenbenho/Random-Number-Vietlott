const { PlaywrightCrawler } = require('crawlee');

async function test() {
    console.log("Testing Loto 5/35 crawl...");
    let count = 0;
    const crawler = new PlaywrightCrawler({
        headless: true, // or false to see
        requestHandler: async ({ page }) => {
            console.log("Page loaded.");
            const boxes = await page.locator('.box_kqxs, .content, div[class*="result"], .boxketqua_vl').count();
            console.log(`Found ${boxes} potential result boxes.`);

            // Log texts of first few
            const texts = await page.locator('.box_kqxs').allInnerTexts();
            console.log("Texts found:", texts.slice(0, 3).map(t => t.substring(0, 100).replace(/\n/g, ' ')));
        },
    });

    await crawler.run(['https://minhchinh.com/xo-so-dien-toan-lotto-535.html']);
}

test();
