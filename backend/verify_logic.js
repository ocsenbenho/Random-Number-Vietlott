
const { checkHistory, seedHistory } = require('./utils/history_loader');
const { db } = require('./utils/db');

// Mock specific game data to test the logic
// We need to insert some mock history to test against because the seed data might not be enough or cover all cases
async function runTest() {
    console.log("Starting Backtest Logic Verification...");

    // 1. Max 3D Test
    // Max 3D numbers are like [123, 456].
    // Current logic does `userNumbers.filter(n => drawNumbers.includes(n))`.
    // Valid for Max 3D if exact 3-digit numbers match.
    console.log("\n--- Testing Max 3D ---");
    const max3dDraw = { game: 'max3d', drawDate: '2024-01-01', numbers: [123, 456] };

    // Insert mock draw
    await new Promise((resolve) => {
        db.run("INSERT INTO draw_history (game, draw_date, numbers) VALUES (?, ?, ?)",
            [max3dDraw.game, max3dDraw.drawDate, JSON.stringify(max3dDraw.numbers)], resolve);
    });

    // Test Case A: Exact Match of one number
    await new Promise(resolve => {
        checkHistory('max3d', [123, 789], (err, res) => {
            console.log("Max 3D Check [123, 789] vs Draw [123, 456]:");
            console.log(`- Win Rate: ${res.winRate}%`);
            console.log(`- Wins: ${res.wins}`);
            console.log(`- Best Match Matches: ${res.bestMatch ? res.bestMatch.matches : 'None'}`);
            // Expectation: If logic is >= 3 matches, this will fail (1 match).
            // But for Max 3D, matching 1 number (out of 2 in a draw?) is actually a winning result? 
            // Max 3D prizes: Match 1 number (Consolation?). 
            resolve();
        });
    });

    // 2. Keno Test
    // Keno: User picks up to 10 numbers. Draw has 20 numbers.
    console.log("\n--- Testing Keno ---");
    const kenoDraw = { game: 'keno', drawDate: '2024-01-01', numbers: Array.from({ length: 20 }, (_, i) => i + 1) }; // 1-20

    // Insert mock draw
    await new Promise((resolve) => {
        db.run("INSERT INTO draw_history (game, draw_date, numbers) VALUES (?, ?, ?)",
            [kenoDraw.game, kenoDraw.drawDate, JSON.stringify(kenoDraw.numbers)], resolve);
    });

    // Test Case B: Match 3 numbers
    await new Promise(resolve => {
        checkHistory('keno', [1, 2, 3, 21, 22, 23], (err, res) => {
            console.log("Keno Check [1, 2, 3, ...] vs Draw [1..20]:");
            console.log(`- Matches: ${res.bestMatch ? res.bestMatch.matches : 0}`);
            console.log(`- Win Rate: ${res.winRate}%`);
            // Current logic >= 3 matches is considered win. Correct for Keno?
            resolve();
        });
    });

    console.log("\n--- Verification Complete ---");
    // Clean up mock data (optional, or rely on transient DB if memory)
    // db.run("DELETE FROM draw_history WHERE draw_date = '2024-01-01'"); 
}

// Give DB a moment to initialize if needed
setTimeout(runTest, 1000);
