const { PlaywrightCrawler } = require('crawlee');

async function debugLinks() {
    const urls = ['https://minhchinh.com/xo-so-dien-toan-mega-645.html'];

    const crawler = new PlaywrightCrawler({
        headless: true,
        requestHandler: async ({ page, request }) => {
            console.log(`Inspecting links on ${request.url}...`);
            await page.waitForLoadState('domcontentloaded');

            // Log all links that might be pagination
            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return anchors
                    .map(a => ({ text: a.innerText, href: a.href }))
                    .filter(a => a.href.includes('page') || a.text.includes('Trang') || a.text.match(/^\d+$/));
            });

            console.log("Potential Pagination Links:", links);

            // Also check for specific pagination classes again with a dump
            const html = await page.content();
            if (html.includes('pagination')) console.log("Found 'pagination' string in HTML");
            if (html.includes('paging')) console.log("Found 'paging' string in HTML");
        },
    });

    await crawler.run(urls);
}

debugLinks();
