const { runCrawler } = require('./utils/crawler');

console.log("Starting verification of Loto 5/35 crawler...");
runCrawler('loto535')
    .then((stats) => console.log("Crawler finished. Stats:", stats))
    .catch(err => console.error("Crawler error:", err));
