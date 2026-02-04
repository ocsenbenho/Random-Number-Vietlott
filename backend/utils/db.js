const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database (file-based)
const dbPath = path.resolve(__dirname, '../vietlott.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize Table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS saved_combinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT,
        numbers TEXT, -- Stored as JSON string
        type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

function saveCombination(data, callback) {
    const { game, numbers, type } = data;
    const stmt = db.prepare("INSERT INTO saved_combinations (game, numbers, type) VALUES (?, ?, ?)");
    stmt.run(game, JSON.stringify(numbers), type, function (err) {
        callback(err, this ? this.lastID : null);
    });
    stmt.finalize();
}

function getSavedCombinations(limit, game, callback) {
    let query = `SELECT * FROM saved_combinations`;
    let params = [];

    if (game) {
        query += ` WHERE game = ?`;
        params.push(game);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    db.all(query, params, (err, rows) => {
        if (err) {
            callback(err, null);
            return;
        }
        // Parse numbers back to JSON
        const parsedRows = rows.map(row => ({
            ...row,
            numbers: JSON.parse(row.numbers)
        }));
        callback(null, parsedRows);
    });
}

module.exports = {
    db, // Export db instance for other modules
    saveCombination,
    getSavedCombinations
};
