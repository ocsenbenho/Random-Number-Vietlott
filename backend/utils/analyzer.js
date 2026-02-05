const { db } = require('./db');
const { secureRandomInt } = require('./rng');

/**
 * Fetch last N draws for a game.
 * @param {string} game 
 * @param {number} limit 
 * @returns {Promise<any[]>}
 */
const getHistory = (game, limit = 50) => {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT numbers FROM draw_history WHERE game = ? ORDER BY draw_date DESC LIMIT ?",
            [game, limit],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => JSON.parse(r.numbers)));
            }
        );
    });
};

/**
 * Analyze history to get weights for each number.
 * Strategy:
 * - Count frequency of each number.
 * - Calculate "Gap" (draws since last appearance).
 * - Weight = Base + (Frequency * 2) + (Gap * 0.5)
 * @param {number[][]} history 
 * @param {number} min 
 * @param {number} max 
 */
const analyze = (history, min, max) => {
    const stats = {};
    for (let i = min; i <= max; i++) {
        stats[i] = { freq: 0, gap: 0, lastSeenIndex: -1 };
    }

    history.forEach((draw, index) => { // index 0 is most recent
        draw.forEach(num => {
            if (stats[num]) {
                stats[num].freq++;
                if (stats[num].lastSeenIndex === -1) {
                    stats[num].lastSeenIndex = index;
                }
            }
        });
    });

    // Calculate Gap and Weights
    Object.keys(stats).forEach(k => {
        const num = parseInt(k);
        const s = stats[num];
        s.gap = s.lastSeenIndex === -1 ? history.length : s.lastSeenIndex;

        // Weight Formula:
        // High Freq -> High Weight (Hot)
        // High Gap -> Moderate Weight (Due/Cold)
        // We want a balance.
        s.weight = 10 + (s.freq * 2) + (s.gap * 0.5);
    });

    return stats;
};

/**
 * Generate numbers using weighted probability.
 * @param {number} min 
 * @param {number} max 
 * @param {number} count 
 * @param {object} stats 
 * @param {boolean} sorted - If true (default), sort results. If false, return in selection order.
 */
const generateWeighted = (min, max, count, stats, sorted = true) => {
    const pool = [];
    const results = [];
    const picked = new Set();
    const range = max - min + 1;

    if (range < count) throw new Error("Range too small");

    // Create a pool where numbers appear 'weight' times
    // To save memory, we can use a Cumulative Distribution Function (CDF) approach,
    // but for 6/45, a pool array is fine and fast.

    // Normalize weights to avoid massive arrays? 
    // Max weight approx: 10 + (10*2) + (50*0.5) = 55.
    // Pool size = 45 * ~30 = 1350 items. Trivial for JS.

    for (let i = min; i <= max; i++) {
        const weight = Math.floor(stats[i].weight || 1);
        for (let w = 0; w < weight; w++) {
            pool.push(i);
        }
    }

    while (results.length < count) {
        if (pool.length === 0) break; // Should not happen

        const idx = secureRandomInt(0, pool.length - 1);
        const num = pool[idx];

        if (!picked.has(num)) {
            picked.add(num);
            results.push(num); // Preserve order
        }
    }

    return sorted ? results.sort((a, b) => a - b) : results;
};

module.exports = { getHistory, analyze, generateWeighted };
