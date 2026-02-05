const cron = require('node-cron');

console.log('Testing node-cron...');

cron.schedule('* * * * *', () => {
    console.log('Cron job ran successfully!');
    process.exit(0);
});

console.log('Cron job scheduled for every minute. Waiting for execution...');
// Exit after 65 seconds if nothing happens
setTimeout(() => {
    console.error('Timeout waiting for cron job.');
    process.exit(1);
}, 65000);
