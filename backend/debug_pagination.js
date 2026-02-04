const { PlaywrightCrawler } = require('crawlee');

async function checkPagination() {
    const urls = [
        'https://minhchinh.com/xo-so-dien-toan-mega-645.html', // First page
        'https://minhchinh.com/xo-so-dien-toan-mega-645.html?page=2', // Second page
        'https://minhchinh.com/xo-so-dien-toan-keno.html?page=2'
    ];

    const crawler = new PlaywrightCrawler({
        headless: true,
        requestHandler: async ({ page, request }) => {
            console.log(`Checking ${request.url}...`);
            await page.waitForTimeout(2000);

            // Extract the first date found on the page to verify it's different
            const bodyText = await page.innerText('body');
            const dateMatch = bodyText.match(/(\d{2}\/\d{2}\/\d{4})/);

            if (dateMatch) {
                console.log(`First date found on ${request.url}: ${dateMatch[1]}`);
            } else {
                console.log(`No date found on ${request.url}`);
            }

            // Also check for pagination controls
            const paging = await page.locator('.pagination, .pagination2, .paging').count();
            console.log(`Pagination elements found: ${paging}`);
        },
    });

    await crawler.run(urls);
}

checkPagination();
