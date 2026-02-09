/**
 * Advanced Statistical Analysis for Lottery Numbers
 * Analyzes patterns, trends, and statistical indicators
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'vietlott.db');
const db = new sqlite3.Database(dbPath);

// ============ ANALYSIS FUNCTIONS ============

/**
 * Get all draws for a game
 */
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

/**
 * 1. FREQUENCY ANALYSIS
 * Count how many times each number appears
 */
function analyzeFrequency(draws, min, max) {
    const freq = {};
    for (let i = min; i <= max; i++) freq[i] = 0;

    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers.flat() : draw.numbers;
        nums.forEach(n => {
            if (freq[n] !== undefined) freq[n]++;
        });
    });

    // Convert to sorted array
    return Object.entries(freq)
        .map(([num, count]) => ({ number: parseInt(num), count, percentage: (count / draws.length * 100).toFixed(2) }))
        .sort((a, b) => b.count - a.count);
}

/**
 * 2. GAP ANALYSIS
 * How many draws since each number last appeared
 */
function analyzeGap(draws, min, max) {
    const gaps = {};
    for (let i = min; i <= max; i++) gaps[i] = draws.length; // Default to max gap

    draws.forEach((draw, index) => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers.flat() : draw.numbers;
        nums.forEach(n => {
            if (gaps[n] === draws.length) {
                gaps[n] = index; // First occurrence (from most recent)
            }
        });
    });

    return Object.entries(gaps)
        .map(([num, gap]) => ({ number: parseInt(num), gap }))
        .sort((a, b) => b.gap - a.gap);
}

/**
 * 3. PAIR ANALYSIS (CO-OCCURRENCE)
 * Numbers that appear together frequently
 */
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

/**
 * 4. CONSECUTIVE NUMBER ANALYSIS
 * How often consecutive numbers appear together
 */
function analyzeConsecutive(draws) {
    let withConsecutive = 0;
    let maxConsecutive = 0;

    draws.forEach(draw => {
        const nums = (Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers)
            .sort((a, b) => a - b);

        let consecutive = 1;
        let hasConsec = false;

        for (let i = 1; i < nums.length; i++) {
            if (nums[i] === nums[i - 1] + 1) {
                consecutive++;
                hasConsec = true;
            } else {
                maxConsecutive = Math.max(maxConsecutive, consecutive);
                consecutive = 1;
            }
        }
        maxConsecutive = Math.max(maxConsecutive, consecutive);
        if (hasConsec) withConsecutive++;
    });

    return {
        drawsWithConsecutive: withConsecutive,
        percentage: (withConsecutive / draws.length * 100).toFixed(2),
        maxConsecutiveEver: maxConsecutive
    };
}

/**
 * 5. ODD/EVEN DISTRIBUTION
 */
function analyzeOddEven(draws) {
    const distribution = {};

    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers;
        const oddCount = nums.filter(n => n % 2 === 1).length;
        const key = `${oddCount}odd-${nums.length - oddCount}even`;
        distribution[key] = (distribution[key] || 0) + 1;
    });

    return Object.entries(distribution)
        .map(([pattern, count]) => ({ pattern, count, percentage: (count / draws.length * 100).toFixed(2) }))
        .sort((a, b) => b.count - a.count);
}

/**
 * 6. HIGH/LOW DISTRIBUTION
 */
function analyzeHighLow(draws, midPoint) {
    const distribution = {};

    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers;
        const lowCount = nums.filter(n => n < midPoint).length;
        const key = `${lowCount}low-${nums.length - lowCount}high`;
        distribution[key] = (distribution[key] || 0) + 1;
    });

    return Object.entries(distribution)
        .map(([pattern, count]) => ({ pattern, count, percentage: (count / draws.length * 100).toFixed(2) }))
        .sort((a, b) => b.count - a.count);
}

/**
 * 7. SUM ANALYSIS
 */
function analyzeSum(draws) {
    const sums = draws.map(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers[0] : draw.numbers;
        return nums.reduce((a, b) => a + b, 0);
    });

    const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
    const min = Math.min(...sums);
    const max = Math.max(...sums);

    // Distribution by range
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

/**
 * 8. DECADE ANALYSIS
 * Distribution across decades (1-10, 11-20, etc.)
 */
function analyzeDecades(draws, max) {
    const decadeCount = Math.ceil(max / 10);
    const distribution = {};

    for (let i = 0; i < decadeCount; i++) {
        const start = i * 10 + 1;
        const end = Math.min((i + 1) * 10, max);
        distribution[`${start}-${end}`] = 0;
    }

    draws.forEach(draw => {
        const nums = Array.isArray(draw.numbers[0]) ? draw.numbers.flat() : draw.numbers;
        nums.forEach(n => {
            const decade = Math.floor((n - 1) / 10);
            const start = decade * 10 + 1;
            const end = Math.min((decade + 1) * 10, max);
            const key = `${start}-${end}`;
            if (distribution[key] !== undefined) distribution[key]++;
        });
    });

    const totalNumbers = draws.length * (Array.isArray(draws[0]?.numbers[0]) ? draws[0].numbers[0].length : draws[0]?.numbers.length || 6);

    return Object.entries(distribution)
        .map(([decade, count]) => ({ decade, count, percentage: (count / totalNumbers * 100).toFixed(2) }));
}

/**
 * 9. TREND ANALYSIS (Moving Average)
 * Detect if numbers are trending up or down
 */
function analyzeTrend(draws, number, windowSize = 10) {
    const appearances = [];

    for (let i = 0; i < draws.length - windowSize; i++) {
        const window = draws.slice(i, i + windowSize);
        const count = window.filter(d => {
            const nums = Array.isArray(d.numbers[0]) ? d.numbers.flat() : d.numbers;
            return nums.includes(number);
        }).length;
        appearances.push(count);
    }

    // Calculate trend (positive = increasing, negative = decreasing)
    if (appearances.length < 2) return { trend: 'insufficient data' };

    const recent = appearances.slice(0, Math.floor(appearances.length / 2));
    const older = appearances.slice(Math.floor(appearances.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return {
        recentAvg: recentAvg.toFixed(2),
        olderAvg: olderAvg.toFixed(2),
        trend: recentAvg > olderAvg ? 'INCREASING' : recentAvg < olderAvg ? 'DECREASING' : 'STABLE'
    };
}

/**
 * 10. PREDICTION SCORE
 * Combine all factors into a single score
 */
function calculatePredictionScore(number, freq, gap, trend, maxFreq, maxGap) {
    // Normalize factors to 0-100
    const freqScore = (freq / maxFreq) * 40;        // Frequency weight: 40%
    const gapScore = (gap / maxGap) * 30;           // Gap weight: 30% (higher gap = more due)
    const trendScore = trend === 'INCREASING' ? 20 : trend === 'DECREASING' ? 5 : 10;
    const randomFactor = Math.random() * 10;        // Some randomness: 10%

    return {
        number,
        score: (freqScore + gapScore + trendScore + randomFactor).toFixed(2),
        breakdown: { freqScore: freqScore.toFixed(2), gapScore: gapScore.toFixed(2), trendScore, randomFactor: randomFactor.toFixed(2) }
    };
}

// ============ MAIN ANALYSIS ============

async function analyzeGame(game, min, max, midPoint) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 PHÂN TÍCH SÂU: ${game.toUpperCase()}`);
    console.log(`${'='.repeat(60)}`);

    const draws = await getDraws(game);
    console.log(`\n📈 Tổng số kỳ quay: ${draws.length}`);

    if (draws.length < 10) {
        console.log('⚠️  Không đủ dữ liệu để phân tích chính xác');
        return;
    }

    // 1. Frequency
    console.log('\n📊 1. PHÂN TÍCH TẦN SUẤT (Top 10 Hot Numbers):');
    const frequency = analyzeFrequency(draws, min, max);
    frequency.slice(0, 10).forEach((f, i) => {
        console.log(`   ${i + 1}. Số ${f.number}: ${f.count} lần (${f.percentage}%)`);
    });

    console.log('\n❄️  Top 10 Cold Numbers:');
    frequency.slice(-10).reverse().forEach((f, i) => {
        console.log(`   ${i + 1}. Số ${f.number}: ${f.count} lần (${f.percentage}%)`);
    });

    // 2. Gap
    console.log('\n⏱️  2. SỐ LÂU CHƯA XUẤT HIỆN (Top 10):');
    const gaps = analyzeGap(draws, min, max);
    gaps.slice(0, 10).forEach((g, i) => {
        console.log(`   ${i + 1}. Số ${g.number}: ${g.gap} kỳ kể từ lần cuối`);
    });

    // 3. Pairs
    console.log('\n👫 3. CẶP SỐ HAY ĐI CÙNG (Top 10):');
    const pairs = analyzePairs(draws);
    pairs.slice(0, 10).forEach((p, i) => {
        console.log(`   ${i + 1}. [${p.pair}]: ${p.count} lần`);
    });

    // 4. Consecutive
    console.log('\n📏 4. PHÂN TÍCH SỐ LIÊN TIẾP:');
    const consecutive = analyzeConsecutive(draws);
    console.log(`   Số kỳ có số liên tiếp: ${consecutive.drawsWithConsecutive} (${consecutive.percentage}%)`);
    console.log(`   Số liên tiếp dài nhất: ${consecutive.maxConsecutiveEver}`);

    // 5. Odd/Even
    console.log('\n🔢 5. PHÂN BỐ CHẴN/LẺ:');
    const oddEven = analyzeOddEven(draws);
    oddEven.forEach(oe => {
        console.log(`   ${oe.pattern}: ${oe.count} kỳ (${oe.percentage}%)`);
    });

    // 6. High/Low
    console.log('\n📊 6. PHÂN BỐ CAO/THẤP:');
    const highLow = analyzeHighLow(draws, midPoint);
    highLow.forEach(hl => {
        console.log(`   ${hl.pattern}: ${hl.count} kỳ (${hl.percentage}%)`);
    });

    // 7. Sum
    console.log('\n➕ 7. PHÂN TÍCH TỔNG:');
    const sum = analyzeSum(draws);
    console.log(`   Trung bình: ${sum.average}`);
    console.log(`   Min: ${sum.min}, Max: ${sum.max}`);
    console.log('   Phân bố theo khoảng:');
    sum.ranges.forEach(r => {
        console.log(`     ${r.range}: ${r.count} kỳ`);
    });

    // 8. Decades
    console.log('\n📅 8. PHÂN BỐ THEO THẬP KỲ:');
    const decades = analyzeDecades(draws, max);
    decades.forEach(d => {
        console.log(`   ${d.decade}: ${d.count} số (${d.percentage}%)`);
    });

    // 9. Prediction Scores
    console.log('\n🎯 9. ĐIỂM DỰ ĐOÁN (Top 15):');
    const maxFreq = Math.max(...frequency.map(f => f.count));
    const maxGap = Math.max(...gaps.map(g => g.gap));

    const scores = [];
    for (let n = min; n <= max; n++) {
        const freq = frequency.find(f => f.number === n)?.count || 0;
        const gap = gaps.find(g => g.number === n)?.gap || 0;
        const trend = analyzeTrend(draws, n, 10).trend;
        scores.push(calculatePredictionScore(n, freq, gap, trend, maxFreq, maxGap));
    }

    scores.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    scores.slice(0, 15).forEach((s, i) => {
        console.log(`   ${i + 1}. Số ${s.number}: ${s.score} điểm`);
    });

    // Recommended numbers
    console.log('\n✨ BỘ SỐ ĐỀ XUẤT:');
    const recommended = scores.slice(0, 6).map(s => s.number).sort((a, b) => a - b);
    console.log(`   [${recommended.join(', ')}]`);

    return {
        game,
        totalDraws: draws.length,
        hotNumbers: frequency.slice(0, 10),
        coldNumbers: frequency.slice(-10),
        overdue: gaps.slice(0, 10),
        topPairs: pairs.slice(0, 10),
        oddEvenDistribution: oddEven,
        highLowDistribution: highLow,
        sumStats: sum,
        predictionScores: scores.slice(0, 15),
        recommended
    };
}

// ============ RUN ============

async function main() {
    console.log('🔬 BẮT ĐẦU PHÂN TÍCH DỮ LIỆU XỔ SỐ VIETLOT\n');
    console.log('Ngày phân tích:', new Date().toLocaleDateString('vi-VN'));

    const results = {};

    // Mega 6/45
    results.mega645 = await analyzeGame('mega645', 1, 45, 23);

    // Power 6/55
    results.power655 = await analyzeGame('power655', 1, 55, 28);

    // Loto 5/35
    results.loto535 = await analyzeGame('loto535', 1, 35, 18);

    console.log('\n\n' + '='.repeat(60));
    console.log('📝 KẾT LUẬN');
    console.log('='.repeat(60));
    console.log(`
⚠️  LƯU Ý QUAN TRỌNG:
- Xổ số là trò chơi NGẪU NHIÊN
- Các pattern trên chỉ mang tính THAM KHẢO
- Không có phương pháp nào đảm bảo trúng thưởng
- Kết quả quá khứ KHÔNG ảnh hưởng đến tương lai

💡 KHUYẾN NGHỊ:
- Sử dụng 'balanced' strategy cho bộ số cân đối
- Kết hợp Hot numbers + Overdue numbers
- Tránh các pattern hiếm (toàn chẵn/lẻ, consecutive)
`);

    db.close();
    return results;
}

main().catch(console.error);
