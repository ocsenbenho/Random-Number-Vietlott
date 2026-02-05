const { PlaywrightCrawler } = require('crawlee');
const { db } = require('./db');

// Helper to format Date to DD-MM-YYYY
const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
};

// Generate URLs for past draws
const generateHistoricalUrls = () => {
    const urls = [];
    const today = new Date();
    // Use fixed start date for consistent verification if needed, or today.
    // For now, go back 60 days from today.
    const lookbackDays = 60;

    for (let i = 0; i < lookbackDays; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const fDate = formatDate(d);

        // Mega 6/45: Wed(3), Fri(5), Sun(0)
        if ([0, 3, 5].includes(dayOfWeek)) {
            urls.push({
                url: `https://minhchinh.com/xs-mega-645-ket-qua-mega-645-ngay-${fDate}.html`,
                game: 'mega645'
            });
        }

        // Power 6/55: Tue(2), Thu(4), Sat(6)
        if ([2, 4, 6].includes(dayOfWeek)) {
            urls.push({
                url: `https://minhchinh.com/xs-power-655-ket-qua-power-655-ngay-${fDate}.html`,
                game: 'power655'
            });
        }

        // Max 3D: Mon(1), Wed(3), Fri(5)
        if ([1, 3, 5].includes(dayOfWeek)) {
            urls.push({
                url: `https://minhchinh.com/xs-max-3d-ket-qua-max-3d-ngay-${fDate}.html`,
                game: 'max3d'
            });
        }

        // Loto 5/35: Daily?
        urls.push({
            url: `https://www.minhchinh.com/xs-lotto-535-ket-qua-lotto-535-ngay-${fDate}.html`, // Corrected URL pattern
            game: 'loto535'
        });
    }
    return urls;
};

// Base URLs for latest and Keno
const BASE_URLS = [
    { url: 'https://minhchinh.com/xo-so-dien-toan-mega-645.html', game: 'mega645' },
    { url: 'https://minhchinh.com/xo-so-dien-toan-power-655.html', game: 'power655' },
    { url: 'https://minhchinh.com/xo-so-dien-toan-max-3d.html', game: 'max3d' },
    { url: 'https://minhchinh.com/xo-so-dien-toan-keno.html', game: 'keno' },
    { url: 'https://www.minhchinh.com/xo-so-dien-toan-lotto-535.html', game: 'loto535' }
];

// const URLS = [...BASE_URLS, ...generateHistoricalUrls()]; // Moved inside runCrawler

const saveToDbPromise = (game, drawDate, numbers) => {
    return new Promise((resolve, reject) => {
        // Validate inputs
        if (!game || !drawDate || !numbers || !Array.isArray(numbers)) {
            resolve(false);
            return;
        }

        const numStr = JSON.stringify(numbers);

        // Attempt Insert directly (relying on UNIQUE index)
        db.run(
            `INSERT INTO draw_history (game, draw_date, numbers) VALUES (?, ?, ?)`,
            [game, drawDate, numStr],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        // Already exists, ignore
                        resolve(false);
                    } else {
                        console.error("DB Insert Error:", err.message);
                        resolve(false);
                    }
                    return;
                }
                // Success
                resolve(true);
            }
        );
    });
};

const runCrawler = async (specificGame = null) => {
    // 1. Generate URLs dynamically (so 'today' is correct)
    const currentHistoryUrls = generateHistoricalUrls();
    const allUrls = [...BASE_URLS, ...currentHistoryUrls];

    // Filter if needed
    const urlsToCrawl = (specificGame ? allUrls.filter(u => u.game === specificGame) : allUrls).map(u => {
        // For BASE_URLS (latest results), we MUST recrawl them every time.
        // We add a uniqueKey based on timestamp to force Crawlee to treat them as new.
        // For history URLs (date specific), we can keep them standard (skip if done), 
        // but since we want to ensure we get data, let's just force all for now or 
        // strictly force BASE_URLS.
        if (BASE_URLS.find(b => b.url === u.url)) {
            return {
                url: u.url,
                uniqueKey: `${u.url}-${Date.now()}`, // Force recrawl
                userData: { game: u.game }
            };
        }
        return {
            url: u.url,
            userData: { game: u.game } // Pass game code in userData
        };
    });

    const stats = {
        processed: 0,
        newItems: 0,
        errors: []
    };

    const crawler = new PlaywrightCrawler({
        // Headless is true by default
        headless: true,
        requestHandler: async ({ page, request, log }) => {
            // Retrieve game from userData (since we can't lookup in static URLS anymore)
            const game = request.userData.game;
            if (!game) return;

            log.info(`Processing ${game} from ${request.url}`);

            try {
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(3000);

                // Pagination Loop
                // If URL is specific date (history), only crawl page 1.
                const isHistoryUrl = request.url.includes('ngay-');
                const maxPages = isHistoryUrl ? 1 : 5;

                for (let p = 1; p <= maxPages; p++) {
                    log.info(`Crawling page ${p} for ${game}...`);

                    // 1. Extract data from current page
                    const results = await page.evaluate((gameCode) => {
                        // Title keywords to identify the result block
                        const keywords = {
                            'mega645': 'Mega 6',
                            'power655': 'Power 6',
                            'max3d': 'Max 3D',
                            'keno': 'Keno',
                            'loto535': 'Lotto'
                        };
                        const titleKeyword = keywords[gameCode] || 'Vietlott';

                        const extractNumbers = (container, gCode) => {
                            // 1. Try finding balls/specific elements first
                            const balls = container.querySelectorAll('.ball, .bong_tron, .ball_red, .ball_blue, div[class*="ball"], span[class*="ball"], .max3d_number div, .boxKQKeno > div');
                            if (balls.length > 0) {
                                return Array.from(balls).map(b => parseInt(b.innerText.trim())).filter(n => !isNaN(n));
                            }

                            // 2. Fallback to text regex
                            const text = container.innerText;
                            let matches;

                            if (gCode === 'max3d') {
                                matches = text.match(/\b\d{3}\b/g);
                            } else {
                                matches = text.match(/\b\d{1,2}\b/g);
                            }

                            if (matches) {
                                return matches.map(n => parseInt(n)).filter(n => !isNaN(n));
                            }
                            return [];
                        };

                        let gatheredCandidates = [];

                        // KENO SPECIAL HANDLING
                        if (gameCode === 'keno') {
                            const kenoRows = Array.from(document.querySelectorAll('.wrapperKQKeno'));
                            for (const row of kenoRows) {
                                const kyEl = row.querySelector('.kyKQKeno');
                                const timeEl = row.querySelector('.timeKQ');
                                const numsEl = row.querySelector('.boxKQKeno');

                                if (kyEl && timeEl && numsEl) {
                                    const dateLines = timeEl.innerText.trim().split('\n');
                                    let dateStr = '';
                                    if (dateLines.length >= 2) {
                                        dateStr = `${dateLines[0]} ${dateLines[1]}`;
                                    } else {
                                        dateStr = dateLines[0];
                                    }

                                    const nums = extractNumbers(numsEl, gameCode);
                                    if (nums.length >= 20) {
                                        gatheredCandidates.push({ date: dateStr, numbers: nums });
                                    }
                                }
                            }
                        } else {
                            // STANDARD HANDLING
                            const boxes = Array.from(document.querySelectorAll('.box_kqxs, .content, div[class*="result"], .boxketqua_vl'));

                            for (const box of boxes) {
                                // REMOVED STRICT KEYWORD CHECK: if (box.innerText.toLowerCase().includes(titleKeyword.toLowerCase()))
                                // Instead, we trust the URL and just check for a valid date pattern.
                                const dateMatch = box.innerText.match(/(\d{2}\/\d{2}\/\d{4})/);
                                if (!dateMatch) continue;

                                let date = dateMatch[1];
                                const timeMatch = box.innerText.match(/(\d{2}[:h]\d{2})/);
                                if (timeMatch && (gameCode === 'loto535')) {
                                    date += ` ${timeMatch[1].replace('h', ':')}`;
                                }

                                const nums = extractNumbers(box, gameCode);
                                const unique = [...new Set(nums)];
                                let candidate = null;

                                if (gameCode === 'max3d') {
                                    if (unique.length >= 2) {
                                        candidate = { date, numbers: unique };
                                    }
                                } else if (gameCode === 'loto535') {
                                    // Validate: No duplicates, max 35
                                    const isUnique = new Set(nums).size === nums.length;
                                    const isRangeValid = nums.every(n => n >= 1 && n <= 35);

                                    if (!isUnique || !isRangeValid) {
                                        // log.info inside evaluate is not possible
                                        // console.log(`[Loto535] REJECTED candidate: ...`);
                                    }

                                    if (nums.length >= 5 && isUnique && isRangeValid) {
                                        candidate = { date, numbers: nums };
                                    }
                                } else {
                                    if (unique.length >= 6) {
                                        candidate = { date, numbers: unique };
                                    }
                                }

                                if (candidate && candidate.date) {
                                    gatheredCandidates.push(candidate);
                                }
                            }
                        }

                        // Fallback Body (only for page 1 usually)
                        // Fallback Body (only for page 1 usually) - REMOVED TO PREVENT GARBAGE DATA
                        // if (gatheredCandidates.length === 0 && gameCode !== 'keno') {
                        //     const bodyText = document.body.innerText;
                        //     const dateMatch = bodyText.match(/(\d{2}\/\d{2}\/\d{4})/);
                        //     if (dateMatch) {
                        //         let d = dateMatch[1];
                        //         const allNums = extractNumbers(document.body, gameCode);
                        //         // Too risky to just grab all numbers from body
                        //         // gatheredCandidates.push({ date: d, numbers: allNums });
                        //     }
                        // }

                        return gatheredCandidates;
                    }, game);

                    log.info(`[Page ${p}] Found ${results.length} candidates for ${game}`);

                    // 2. Process & Save Results
                    for (const result of results) {
                        let drawDate = '';
                        if (result.date) {
                            const parts = result.date.split(' ');
                            const dPart = parts[0].split('/').reverse().join('-');
                            if (parts.length > 1) {
                                drawDate = `${dPart} ${parts[1]}`;
                            } else {
                                drawDate = dPart;
                            }
                        }
                        let finalNumbers = [];
                        if (game === 'max3d') {
                            finalNumbers = [...new Set(result.numbers)].slice(0, 20);
                        } else if (game === 'keno') {
                            finalNumbers = [...new Set(result.numbers)].filter(n => n >= 1 && n <= 80).slice(0, 20);
                        } else if (game === 'loto535') {
                            finalNumbers = result.numbers.filter(n => n >= 1 && n <= 35).slice(0, 6);
                        } else if (game === 'mega645') {
                            finalNumbers = [...new Set(result.numbers)].filter(n => n >= 1 && n <= 45).slice(0, 6);
                        } else if (game === 'power655') {
                            finalNumbers = [...new Set(result.numbers)].filter(n => n >= 1 && n <= 55).slice(0, 7);
                        }

                        if (drawDate && finalNumbers.length > 0) {
                            // log.info(`Found result for ${game}: ${drawDate}`);
                            const saved = await saveToDbPromise(game, drawDate, finalNumbers);
                            if (saved) stats.newItems++;
                        }
                    }

                    // 3. Navigation Logic (Click Next)
                    if (p < maxPages) {
                        try {
                            const nextPage = p + 1;
                            log.info(`Attempting to navigate to page ${nextPage}...`);

                            const clicked = await page.evaluate(async (nextPageNum) => {
                                const anchors = Array.from(document.querySelectorAll('a, .pagination li a, .paging a'));
                                for (const a of anchors) {
                                    const t = a.innerText.trim();
                                    if (t === String(nextPageNum) || t === '>' || t.toLowerCase().includes('sau')) {
                                        a.click();
                                        return true;
                                    }
                                }
                                return false;
                            }, nextPage);

                            if (clicked) {
                                await page.waitForTimeout(2000);
                                await page.waitForLoadState('domcontentloaded');
                            } else {
                                log.info("No more pagination links found.");
                                break;
                            }
                        } catch (err) {
                            log.warning(`Pagination error on page ${p}: ${err.message}`);
                            break;
                        }
                    }
                }

                stats.processed++;
            } catch (err) {
                const msg = `Error processing ${game}: ${err.message}`;
                log.error(msg);
                stats.errors.push(msg);
            }
        },

        failedRequestHandler({ request, log }) {
            const msg = `Request ${request.url} failed.`;
            log.error(msg);
            stats.errors.push(msg);
        },
    });

    await crawler.run(urlsToCrawl);
    return stats;
};

module.exports = { runCrawler };
