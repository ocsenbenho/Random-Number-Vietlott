const { PlaywrightCrawler } = require('crawlee');

async function debugLoto() {
    console.log("Debugging Loto 5/35 content...");
    const crawler = new PlaywrightCrawler({
        headless: true,
        requestHandler: async ({ page }) => {
            const fs = require('fs');
            // Use the broad selector
            const boxes = page.locator('.box_kqxs, .content, div[class*="result"], .boxketqua_vl');
            const count = await boxes.count();
            let output = `Found ${count} boxes.\n\n`;

            for (let i = 0; i < count; i++) {
                const box = boxes.nth(i);
                const text = await box.innerText();
                if (text.toLowerCase().includes('lotto') && text.match(/\d{2}\/\d{2}\/\d{4}/)) {
                    output += `=== Box ${i} ===\nTIME CHECK: ${text.match(/\d{2}[:h]\d{2}/) ? "Found Time" : "No Time"}\n${text}\n\n`;
                    const html = await box.innerHTML();
                    output += `--- HTML ---\n${html}\n\n`;
                }
            }
            fs.writeFileSync('loto_debug.txt', output);
            console.log("Dumped to loto_debug.txt");
        },
    });

    await crawler.run(['https://minhchinh.com/xo-so-dien-toan-lotto-535.html']);
}

debugLoto();
