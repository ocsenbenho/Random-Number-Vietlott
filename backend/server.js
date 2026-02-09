const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateMatrix, generateDigits, generateOptimizedMatrix, generateMechanicalDraw } = require('./utils/rng');
const { saveCombination, getSavedCombinations, deleteCombination, db } = require('./utils/db');
const { seedHistory, checkHistory } = require('./utils/history_loader');
const { runCrawler } = require('./utils/crawler');
const { initScheduler } = require('./utils/scheduler');
const { entropyPool, generateEnhancedDraw, generateEnhancedDrawUnsorted } = require('./utils/entropy');
const { generateBalanced, analyzePairs, isValidCombination, CONFIGS } = require('./utils/strategies');
const { getDraws, analyzeFrequency, analyzeGap, analyzePairs: analyzePairsStats, analyzeOddEven, analyzeSum } = require('./utils/statistics');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize History Data
seedHistory();

// Initialize Scheduler
initScheduler();

// Load Configs
const configs = {};
const configDir = path.join(__dirname, 'config');

fs.readdirSync(configDir).forEach(file => {
    if (file.endsWith('.json')) {
        const key = file.replace('.json', '');
        configs[key] = require(path.join(configDir, file));
    }
});

// Access Control Middleware (Simple)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes

// GET /games - List all available games
app.get('/games', (req, res) => {
    const gamesList = Object.entries(configs).map(([id, config]) => ({
        id,
        name: config.name
    }));
    res.json(gamesList);
});

// POST /save - Save a combination
app.post('/save', (req, res) => {
    const { game, numbers, type } = req.body;
    if (!game || !numbers) {
        return res.status(400).json({ error: "Missing game or numbers" });
    }
    saveCombination({ game, numbers, type }, (err, id) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id });
    });
});

// GET /saved - Get saved combinations
app.get('/saved', (req, res) => {
    const { limit, game } = req.query;
    getSavedCombinations(parseInt(limit) || 10, game, (err, items) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(items);
    });
});

// DELETE /saved/:id - Delete a saved combination
app.delete('/saved/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "Missing id parameter" });
    }
    deleteCombination(parseInt(id), (err, changes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (changes === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        res.json({ success: true, deleted: changes });
    });
});

// POST /check-history - Check generated numbers against history
app.post('/check-history', (req, res) => {
    const { game, numbers } = req.body;
    if (!game || !numbers) {
        return res.status(400).json({ error: "Missing game or numbers" });
    }
    checkHistory(game, numbers, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

// GET /history - Get draw history for a game
app.get('/history', (req, res) => {
    const { game } = req.query;
    if (!game) {
        return res.status(400).json({ error: "Missing game parameter" });
    }
    db.all(
        "SELECT * FROM draw_history WHERE game = ? ORDER BY draw_date DESC LIMIT 100",
        [game],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows.map(r => ({
                ...r,
                numbers: JSON.parse(r.numbers)
            })));
        }
    );
});

// POST /crawl - Trigger data crawl
app.post('/crawl', async (req, res) => {
    console.log("Received crawl request");
    try {
        const result = await runCrawler();
        console.log("Crawl finished successfully", result);
        res.json({ success: true, stats: result });
    } catch (err) {
        console.error("Crawl error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /statistics - Get full statistical report
app.get('/statistics', async (req, res) => {
    const { game } = req.query;
    if (!game) {
        return res.status(400).json({ error: "Missing game parameter" });
    }

    try {
        const config = configs[game];
        if (!config) return res.status(400).json({ error: "Invalid game" });

        const draws = await getDraws(game);
        if (draws.length < 5) {
            return res.json({ success: true, insufficientData: true });
        }

        const frequency = analyzeFrequency(draws, config.min, config.max);
        const gaps = analyzeGap(draws, config.min, config.max);
        const pairs = analyzePairsStats(draws);
        const oddEven = analyzeOddEven(draws);
        const sumStats = analyzeSum(draws);

        res.json({
            success: true,
            totalDraws: draws.length,
            frequency: {
                hot: frequency.slice(0, 10),
                cold: frequency.slice(-10).reverse()
            },
            gaps: gaps.slice(0, 10),
            pairs: pairs,
            oddEven: oddEven,
            sum: sumStats
        });
    } catch (err) {
        console.error("Statistics error:", err);
        res.status(500).json({ error: err.message });
    }
});

const { getHistory, analyze, generateWeighted } = require('./utils/analyzer');

app.get('/generate', async (req, res) => {
    const { game, smart, strategy } = req.query; // strategy: 'random', 'smart', 'prediction', 'enhanced', 'balanced'
    if (!game || !configs[game]) {
        return res.status(400).json({ error: "Invalid game" });
    }

    const config = configs[game];
    const mode = strategy || (smart === 'true' ? 'smart' : 'random');

    let result;

    if (mode === 'enhanced') {
        // ENHANCED MODE: Multi-source entropy (Random.org + crypto + user entropy)
        try {
            if (game === 'power655') {
                const raw = await generateEnhancedDrawUnsorted(1, 55, 7, true);
                const main = raw.slice(0, 6).sort((a, b) => a - b);
                const special = [raw[6]];
                result = [main, special];
            } else if (config.type === 'compound') {
                const parts = [];
                for (const part of config.parts) {
                    const nums = await generateEnhancedDraw(part.min, part.max, part.size, true);
                    parts.push(nums);
                }
                result = parts;
            } else {
                result = await generateEnhancedDraw(config.min, config.max, config.size, true);
            }
        } catch (err) {
            console.error("Enhanced mode failed, falling back to standard:", err);
            result = generateMechanicalDraw(config.min, config.max, config.size);
        }
    } else if (mode === 'balanced') {
        // BALANCED MODE: Smart selection with odd/even, high/low balance, sum filtering
        try {
            const history = await getHistory(game, 50);
            const stats = analyze(history, config.min, config.max);

            if (game === 'power655') {
                // Power 6/55: 6 main + 1 special
                const main = generateBalanced(1, 55, 6, stats, game);
                // Special number: pick from remaining pool
                const remaining = [];
                for (let i = 1; i <= 55; i++) {
                    if (!main.includes(i)) remaining.push(i);
                }
                const specialIdx = Math.floor(Math.random() * remaining.length);
                const special = [remaining[specialIdx]];
                result = [main, special];
            } else if (config.type === 'compound') {
                const parts = [];
                for (const part of config.parts) {
                    const partGame = game === 'loto535' ? 'loto535' : 'mega645';
                    const nums = generateBalanced(part.min, part.max, part.size, stats, partGame);
                    parts.push(nums);
                }
                result = parts;
            } else {
                result = generateBalanced(config.min, config.max, config.size, stats, game);
            }
        } catch (err) {
            console.error("Balanced mode failed, falling back to standard:", err);
            result = generateMechanicalDraw(config.min, config.max, config.size);
        }
    } else if (mode === 'prediction') {
        try {
            if (config.type === 'compound') {
                const part1 = config.parts[0];
                const history = await getHistory(game, 50);
                const stats = analyze(history, part1.min, part1.max);
                const res1 = generateWeighted(part1.min, part1.max, part1.size, stats);

                const part2 = config.parts[1];
                const res2 = generateMechanicalDraw(part2.min, part2.max, part2.size);

                result = [res1, res2];
            } else if (game === 'power655') {
                // SPECIAL HANDLING FOR POWER 6/55 PREDICTION
                const history = await getHistory(game, 50);
                const stats = analyze(history, 1, 55);
                const raw = generateWeighted(1, 55, 7, stats, false); // false = unsorted

                const main = raw.slice(0, 6).sort((a, b) => a - b);
                const special = [raw[6]];
                result = [main, special];
            } else {
                const history = await getHistory(game, 50);
                const stats = analyze(history, config.min, config.max);
                result = generateWeighted(config.min, config.max, config.size, stats);
            }
        } catch (err) {
            console.error("Prediction failed, falling back to Mechanical:", err);
            if (game === 'power655') {
                const raw = generateMechanicalDraw(1, 55, 7, false);
                const main = raw.slice(0, 6).sort((a, b) => a - b);
                const special = [raw[6]];
                result = [main, special];
            } else if (config.type === 'compound') {
                result = config.parts.map(p => generateMechanicalDraw(p.min, p.max, p.size));
            } else {
                result = generateMechanicalDraw(config.min, config.max, config.size);
            }
        }
    } else {
        const getGenerator = (min, max, size, allowDuplicate) => {
            if (allowDuplicate) return generateDigits(min, max, size);
            if (mode === 'smart') return generateOptimizedMatrix(min, max, size);
            return generateMechanicalDraw(min, max, size);
        };

        if (game === 'power655') {
            // SPECIAL HANDLING FOR POWER 6/55 STANDARD/SMART
            const raw = generateMechanicalDraw(1, 55, 7, false);
            const main = raw.slice(0, 6).sort((a, b) => a - b);
            const special = [raw[6]];
            result = [main, special];
        } else if (config.type === 'compound') {
            result = config.parts.map(part => {
                return getGenerator(part.min, part.max, part.size, part.allowDuplicate);
            });
        } else {
            result = getGenerator(config.min, config.max, config.size, config.allowDuplicate);
        }
    }

    // Force type='compound' for Power 6/55 so frontend renders separation
    const responseType = game === 'power655' ? 'compound' : (config.type || 'standard');

    res.json({
        game: config.name,
        numbers: result,
        type: responseType,
        mode: mode
    });
});

// POST /entropy - Receive user entropy from frontend
app.post('/entropy', (req, res) => {
    const { mouseX, mouseY, timestamp, keyTiming } = req.body;

    entropyPool.addUserEntropy({
        mouseX,
        mouseY,
        timestamp: timestamp || Date.now(),
        keyTiming
    });

    res.json({ success: true, poolSize: entropyPool.pool.length });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
