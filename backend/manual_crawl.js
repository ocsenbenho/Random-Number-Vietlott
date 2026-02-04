const { runCrawler } = require('./utils/crawler');
const { db } = require('./utils/db');

async function test() {
    console.log("Running manual crawl...");
    const stats = await runCrawler();
    console.log("Crawl Result:", stats);

    // Check DB
    db.all("SELECT * FROM draw_history WHERE game='loto535' ORDER BY draw_date DESC LIMIT 20", (err, rows) => {
        console.log("DB Loto 5/35 Rows:", rows.length);
        console.log(rows);
    });
}

test();
