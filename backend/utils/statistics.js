/**
 * Detailed Statistics Analysis for API
 * Refactored from scripts/analyze_patterns.js for use in web API
 */

const { db } = require('./db');

// Helper to get draws (borrowed from analyzer.js but slightly different for full analysis)
function getDraws(game) {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT draw_date, numbers FROM draw_history WHERE game = ? ORDER BY draw_date DESC",
            [game],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => ({
                    date: r.draw_date,
                    numbers: JSON.parse(r.numbers)
                })));
            }
        );
    });
}

function analyzeFrequency(draws, min, max) {
    const freq = {};
    for (let i = min; i <= max; i++) freq[i] = 0;

    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers.flat() : draw.numbers;
        nums.forEach(n => {
            if (freq[n] !== undefined) freq[n]++;
        });
    });

    return Object.entries(freq)
        .map(([num, count]) => ({ number: parseInt(num), count, percentage: (count / draws.length * 100).toFixed(2) }))
        .sort((a, b) => b.count - a.count);
}

function analyzeGap(draws, min, max) {
    const gaps = {};
    for (let i = min; i <= max; i++) gaps[i] = draws.length;

    draws.forEach((draw, index) => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers.flat() : draw.numbers;
        nums.forEach(n => {
            if (gaps[n] === draws.length) {
                gaps[n] = index;
            }
        });
    });

    return Object.entries(gaps)
        .map(([num, gap]) => ({ number: parseInt(num), gap }))
        .sort((a, b) => b.gap - a.gap);
}

function analyzePairs(draws) {
    const pairs = {};

    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers;
        for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
                const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`;
                pairs[key] = (pairs[key] || 0) + 1;
            }
        }
    });

    return Object.entries(pairs)
        .map(([pair, count]) => ({ pair, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
}

function analyzeOddEven(draws) {
    const distribution = {};
    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers;
        const oddCount = nums.filter(n => n % 2 === 1).length;
        const key = `${oddCount} lẻ - ${nums.length - oddCount} chẵn`;
        distribution[key] = (distribution[key] || 0) + 1;
    });
    return Object.entries(distribution)
        .map(([pattern, count]) => ({ pattern, count, percentage: (count / draws.length * 100).toFixed(2) }))
        .sort((a, b) => b.count - a.count);
}

function analyzeSum(draws) {
    const sums = draws.map(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers;
        return nums.reduce((a, b) => a + b, 0);
    });

    const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
    const min = Math.min(...sums);
    const max = Math.max(...sums);

    const ranges = {};
    sums.forEach(sum => {
        const range = `${Math.floor(sum / 20) * 20}-${Math.floor(sum / 20) * 20 + 19}`;
        ranges[range] = (ranges[range] || 0) + 1;
    });

    return {
        average: avg.toFixed(2),
        min,
        max,
        ranges: Object.entries(ranges)
            .map(([range, count]) => ({ range, count }))
            .sort((a, b) => parseInt(a.range) - parseInt(b.range))
    };
}

module.exports = {
    getDraws,
    analyzeFrequency,
    analyzeGap,
    analyzePairs,
    analyzeOddEven,
    analyzeSum
};
