const cron = require('node-cron');
const { runCrawler } = require('./crawler');

const initScheduler = () => {
    console.log('Initializing Automated Scheduler...');

    // 1. Main Games Schedule: 19:15 Daily
    // Games: Mega 6/45, Power 6/55, Max 3D, Loto 5/35
    // Draw happens ~18:00 - 18:30. 19:15 is safe buffer.
    cron.schedule('15 19 * * *', async () => {
        console.log(`[${new Date().toISOString()}] Starting Daily Main Games Crawl...`);
        try {
            // Run crawler for all supported games EXCEPT Keno (logic handled inside crawler or we filter)
            // Currently runCrawler crawls EVERYTHING in BASE_URLS. 
            // Ideally we should filter, but running all is fine too as Keno will just get latest 20.
            // But to be precise, let's filter if possible. 
            // Our runCrawler supports 'specificGame'. If we want multiple, we might need a loop or update runCrawler.
            // For simplicity now, we run ALL. It won't hurt to check Keno at 19:15 too.
            const stats = await runCrawler();
            console.log(`[${new Date().toISOString()}] Daily Crawl Finished. Stats:`, stats);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Daily Crawl Failed:`, error);
        }
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });

    // 2. Keno Schedule: 22:05 Daily
    // Keno runs 06:00 - 21:55. 22:05 catches the last draws.
    cron.schedule('05 22 * * *', async () => {
        console.log(`[${new Date().toISOString()}] Starting Daily Keno Crawl...`);
        try {
            // We can specifically target Keno if we want to isolate logs or resources
            const stats = await runCrawler('keno');
            console.log(`[${new Date().toISOString()}] Keno Crawl Finished. Stats:`, stats);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Keno Crawl Failed:`, error);
        }
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('Scheduler initialized with timezone Asia/Ho_Chi_Minh');
    console.log('- Job 1 (Main Games): 19:15 Daily');
    console.log('- Job 2 (Keno): 22:05 Daily');
};

module.exports = { initScheduler };
