const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateMatrix, generateDigits, generateOptimizedMatrix } = require('./utils/rng');
const { saveCombination, getSavedCombinations, db } = require('./utils/db');
const { seedHistory, checkHistory } = require('./utils/history_loader');
const { runCrawler } = require('./utils/crawler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize History Data
seedHistory();

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
app.get('/games', (req, res) => {
    const games = Object.keys(configs).map(key => ({
        id: key,
        name: configs[key].name
    }));
    res.json(games);
});

// Save Endpoint
app.post('/save', (req, res) => {
    const { game, numbers, type } = req.body;
    if (!game || !numbers) {
        return res.status(400).json({ error: "Missing game or numbers" });
    }

    saveCombination({ game, numbers, type }, (err, id) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to save" });
        }
        res.json({ success: true, id });
    });
});

// Get Saved Endpoint
app.get('/saved', (req, res) => {
    const limit = req.query.limit || 10;
    const game = req.query.game; // Optional filter

    getSavedCombinations(limit, game, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch saved items" });
        }
        res.json(rows);
    });
});

// History Check Endpoint
app.post('/check-history', (req, res) => {
    const { game, numbers } = req.body;
    if (!game || !numbers) {
        return res.status(400).json({ error: "Missing game or numbers" });
    }

    checkHistory(game, numbers, (err, match) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to check history" });
        }
        res.json({ match }); // Returns match object or null
    });
});

// Crawl Endpoint
app.post('/crawl', async (req, res) => {
    try {
        console.log("Received crawl request");
        const stats = await runCrawler();
        console.log("Crawl finished successfully", stats);
        res.json({
            message: "Crawl completed",
            stats: stats
        });
    } catch (err) {
        console.error("Crawl error:", err);
        res.status(500).json({ error: "Crawler failed" });
    }
});

// Get History Endpoint
app.get('/history', (req, res) => {
    const { game } = req.query;
    let sql = "SELECT * FROM draw_history";
    const params = [];

    if (game) {
        sql += " WHERE game = ?";
        params.push(game);
    }

    sql += " ORDER BY draw_date DESC LIMIT 50";

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch history" });
        }
        // Parse numbers string back to array
        const results = rows.map(row => ({
            ...row,
            numbers: JSON.parse(row.numbers)
        }));
        res.json(results);
    });
});

app.get('/generate', (req, res) => {
    const { game, smart } = req.query; // smart parameter
    if (!game || !configs[game]) {
        return res.status(400).json({ error: "Invalid game" });
    }

    const config = configs[game];
    const isSmart = smart === 'true'; // Check if smart mode is enabled

    // Helper to choose generator
    const getGenerator = (min, max, size, allowDuplicate) => {
        if (allowDuplicate) return generateDigits(min, max, size);
        if (isSmart) return generateOptimizedMatrix(min, max, size);
        return generateMatrix(min, max, size);
    };

    let result;
    if (config.type === 'compound') {
        result = config.parts.map(part => {
            return getGenerator(part.min, part.max, part.size, part.allowDuplicate);
        });
    } else {
        result = getGenerator(config.min, config.max, config.size, config.allowDuplicate);
    }

    res.json({
        game: config.name,
        numbers: result,
        type: config.type || 'standard'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
