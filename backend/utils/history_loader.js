const { db } = require('./db');

// Seed Data (10 latest draws - Collected manually on 2026-02-03)
const seedData = [
    // Mega 6/45
    { game: 'mega645', drawDate: '2026-02-01', numbers: [1, 18, 21, 23, 30, 36] },
    { game: 'mega645', drawDate: '2026-01-30', numbers: [16, 17, 30, 41, 42, 45] },
    { game: 'mega645', drawDate: '2026-01-28', numbers: [4, 10, 16, 19, 27, 40] },
    { game: 'mega645', drawDate: '2026-01-25', numbers: [2, 19, 20, 24, 33, 34] },
    { game: 'mega645', drawDate: '2026-01-23', numbers: [9, 15, 16, 20, 22, 31] },
    { game: 'mega645', drawDate: '2026-01-21', numbers: [1, 18, 23, 24, 29, 37] },
    { game: 'mega645', drawDate: '2026-01-18', numbers: [2, 5, 15, 26, 39, 42] },
    { game: 'mega645', drawDate: '2026-01-16', numbers: [2, 10, 21, 31, 34, 40] },
    { game: 'mega645', drawDate: '2026-01-14', numbers: [1, 22, 23, 28, 39, 45] },
    { game: 'mega645', drawDate: '2026-01-11', numbers: [8, 10, 21, 25, 31, 38] },

    // Power 6/55
    { game: 'power655', drawDate: '2026-01-31', numbers: [10, 11, 14, 17, 49, 53] },
    { game: 'power655', drawDate: '2026-01-29', numbers: [11, 15, 22, 32, 34, 54] },
    { game: 'power655', drawDate: '2026-01-27', numbers: [13, 22, 32, 42, 53, 54] },
    { game: 'power655', drawDate: '2026-01-24', numbers: [14, 24, 25, 30, 35, 53] },
    { game: 'power655', drawDate: '2026-01-22', numbers: [2, 20, 21, 29, 36, 50] },
    { game: 'power655', drawDate: '2026-01-20', numbers: [4, 20, 26, 28, 37, 41] },
    { game: 'power655', drawDate: '2026-01-17', numbers: [14, 21, 23, 25, 46, 48] },
    { game: 'power655', drawDate: '2026-01-15', numbers: [13, 21, 31, 34, 48, 55] },
    { game: 'power655', drawDate: '2026-01-13', numbers: [3, 12, 25, 51, 52, 55] },
    { game: 'power655', drawDate: '2026-01-10', numbers: [9, 16, 30, 33, 34, 38] }
];

function seedHistory() {
    db.serialize(() => {
        // Create Table if not exists
        db.run(`CREATE TABLE IF NOT EXISTS draw_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game TEXT,
            draw_date TEXT,
            numbers TEXT
        )`);

        // Check current count
        db.get("SELECT COUNT(*) as count FROM draw_history", (err, row) => {
            if (err) {
                console.error("Error checking history table:", err);
                return;
            }
            if (row.count === 0) {
                console.log("Seeding history data...");
                const stmt = db.prepare("INSERT INTO draw_history (game, draw_date, numbers) VALUES (?, ?, ?)");
                seedData.forEach(item => {
                    stmt.run(item.game, item.drawDate, JSON.stringify(item.numbers));
                });
                stmt.finalize();
                console.log("History data seeded successfully.");
            } else {
                console.log("History data already exists. Skipping seed.");
            }
        });
    });
}

/**
 * Check if the given numbers match any historical draw.
 * Returns detailed statistics and list of matches.
 * @param {string} game 
 * @param {number[]} userNumbers 
 * @param {function} callback 
 */
function checkHistory(game, userNumbers, callback) {
    db.all("SELECT * FROM draw_history WHERE game = ? ORDER BY draw_date DESC", [game], (err, rows) => {
        if (err) {
            callback(err, null);
            return;
        }

        const totalDraws = rows.length;
        const matchCounts = {}; // { 3: 5 (times), 4: 1 ... }
        const details = []; // List of specific matches
        let bestMatch = null;
        let maxMatches = 0;

        // Define game-specific rules
        let minMatchesForWin = 3; // Default for Mega/Power/Keno
        let isExactMatchGame = false;

        if (game === 'max3d' || game === 'max3dpro') {
            minMatchesForWin = 1;
            isExactMatchGame = true;
        } else if (game === 'loto535') { // Loto 5/35
            minMatchesForWin = 2; // Match 2 numbers for lowest prize often
        } else if (game === 'keno') {
            // Keno has variable tiers, but 3 is a reasonable generic "something matched" heuristic for standard play
            minMatchesForWin = 3;
        }

        rows.forEach(row => {
            let drawNumbers;
            try {
                drawNumbers = JSON.parse(row.numbers);
            } catch (e) {
                return;
            }

            // Calculate intersection
            // For Max3D, userNumbers (e.g. [123]) check if 123 exists in drawNumbers.
            // For Matrix games, count shared numbers.
            const matches = userNumbers.filter(n => drawNumbers.includes(n)).length;

            if (matches > 0) {
                if (!matchCounts[matches]) matchCounts[matches] = 0;
                matchCounts[matches]++;
            }

            // Check if this draw qualifies as a "win" or "significant match"
            if (matches >= minMatchesForWin) {
                details.push({
                    drawDate: row.draw_date,
                    matches: matches,
                    numbers: drawNumbers
                });
            }

            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = {
                    drawDate: row.draw_date,
                    numbers: drawNumbers,
                    matches: matches
                };
            }
        });

        // Calculate simplified win rate
        const wins = rows.filter(row => {
            let dNums;
            try { dNums = JSON.parse(row.numbers); } catch (e) { return false; }
            const m = userNumbers.filter(n => dNums.includes(n)).length;
            return m >= minMatchesForWin;
        }).length;

        const winRate = totalDraws > 0 ? ((wins / totalDraws) * 100).toFixed(2) : 0;

        callback(null, {
            totalDraws,
            matchCounts,
            details, // Matches meeting the threshold
            bestMatch, // Absolute best match (even if below threshold, though rarely useful if 0)
            winRate,
            wins,
            minMatchesForWin // Return this so frontend can adjust UI text if needed (e.g. "Matches >= 1")
        });
    });
}

module.exports = { seedHistory, checkHistory };
