const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const url = 'https://minhchinh.com/xs-power-655-ket-qua-power-655-ngay-03-02-2026.html';

    console.log(`Navigating to ${url}...`);
    await page.goto(url);

    const content = await page.content(); // Get full HTML

    // Check balls extraction
    const balls = await page.evaluate(() => {
        const els = document.querySelectorAll('.ball, .bong_tron, .ball_red, .ball_blue, div[class*="ball"], span[class*="ball"]');
        return Array.from(els).map(e => ({
            text: e.innerText,
            className: e.className,
            parentClass: e.parentElement.className
        }));
    });

    console.log("Found balls:");
    console.log(JSON.stringify(balls, null, 2));

    await browser.close();
})();
