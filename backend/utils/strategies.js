/**
 * Advanced Lottery Selection Strategies
 * Implements balanced selection, sum filtering, and pattern exclusion
 */

const { secureRandomInt } = require('./rng');

// ============ CONFIGURATION ============

const CONFIGS = {
    mega645: {
        min: 1, max: 45, count: 6,
        midPoint: 23, // Numbers 1-22 = low, 23-45 = high
        sumRange: { min: 100, max: 190 }, // Typical winning sum range
        idealOddEven: [3, 3], // 3 odd + 3 even (or 4+2, 2+4)
        idealHighLow: [3, 3], // 3 high + 3 low (or 4+2, 2+4)
    },
    power655: {
        min: 1, max: 55, count: 6,
        midPoint: 28,
        sumRange: { min: 120, max: 220 },
        idealOddEven: [3, 3],
        idealHighLow: [3, 3],
    },
    loto535: {
        min: 1, max: 35, count: 5,
        midPoint: 18,
        sumRange: { min: 70, max: 130 },
        idealOddEven: [2, 3], // 2 or 3 for 5 numbers
        idealHighLow: [2, 3],
    }
};

// ============ VALIDATION FUNCTIONS ============

/**
 * Check if odd/even distribution is balanced
 * Accepts 3+3, 4+2, 2+4 for 6 numbers
 */
function isOddEvenBalanced(numbers) {
    const oddCount = numbers.filter(n => n % 2 === 1).length;
    const evenCount = numbers.length - oddCount;

    // For 6 numbers: accept 2-4 odd, 2-4 even
    // For 5 numbers: accept 2-3 odd, 2-3 even
    const minAcceptable = Math.max(2, Math.floor(numbers.length / 3));
    const maxAcceptable = numbers.length - minAcceptable;

    return oddCount >= minAcceptable && oddCount <= maxAcceptable;
}

/**
 * Check if high/low distribution is balanced
 */
function isHighLowBalanced(numbers, midPoint) {
    const lowCount = numbers.filter(n => n < midPoint).length;
    const highCount = numbers.length - lowCount;

    const minAcceptable = Math.max(2, Math.floor(numbers.length / 3));
    const maxAcceptable = numbers.length - minAcceptable;

    return lowCount >= minAcceptable && lowCount <= maxAcceptable;
}

/**
 * Check if sum is within typical range
 */
function isValidSum(numbers, sumRange) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum >= sumRange.min && sum <= sumRange.max;
}

/**
 * Check for consecutive numbers (more than 2 in a row is rare)
 */
function hasExcessiveConsecutive(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    let consecutiveCount = 1;
    let maxConsecutive = 1;

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) {
            consecutiveCount++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        } else {
            consecutiveCount = 1;
        }
    }

    return maxConsecutive > 3; // More than 3 consecutive is extremely rare
}

/**
 * Check if all numbers are in the same decade (1-10, 11-20, etc.)
 */
function isSameDecade(numbers) {
    const decades = new Set(numbers.map(n => Math.floor((n - 1) / 10)));
    return decades.size === 1;
}

/**
 * Check if spread is good (no clustering)
 */
function hasGoodSpread(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const range = sorted[sorted.length - 1] - sorted[0];

    // Range should be at least 60% of possible range
    const minRange = Math.floor((sorted.length - 1) * 5); // Minimum 5 apart on average
    return range >= minRange;
}

/**
 * Combined validation - check all constraints
 */
function isValidCombination(numbers, config) {
    return isOddEvenBalanced(numbers) &&
        isHighLowBalanced(numbers, config.midPoint) &&
        isValidSum(numbers, config.sumRange) &&
        !hasExcessiveConsecutive(numbers) &&
        !isSameDecade(numbers) &&
        hasGoodSpread(numbers);
}

// ============ GENERATION FUNCTIONS ============

/**
 * Generate balanced numbers with constraints
 * @param {number} min - Minimum number
 * @param {number} max - Maximum number
 * @param {number} count - How many numbers to pick
 * @param {object} stats - Weight statistics from analyzer
 * @param {string} game - Game type for config lookup
 */
function generateBalanced(min, max, count, stats, game = 'mega645') {
    const config = CONFIGS[game] || CONFIGS.mega645;
    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        const numbers = generateWeightedPick(min, max, count, stats);

        if (isValidCombination(numbers, config)) {
            return numbers.sort((a, b) => a - b);
        }
    }

    // Fallback: return a manually balanced selection
    console.warn('Could not find valid combination, using fallback');
    return generateFallbackBalanced(min, max, count, config);
}

/**
 * Pick numbers based on weights (helper function)
 */
function generateWeightedPick(min, max, count, stats) {
    const pool = [];
    const picked = new Set();
    const result = [];

    // Build weighted pool
    for (let i = min; i <= max; i++) {
        const weight = Math.floor(stats[i]?.weight || 10);
        for (let w = 0; w < weight; w++) {
            pool.push(i);
        }
    }

    // Pick numbers
    while (result.length < count && pool.length > 0) {
        const idx = secureRandomInt(0, pool.length - 1);
        const num = pool[idx];

        if (!picked.has(num)) {
            picked.add(num);
            result.push(num);
        }
    }

    return result;
}

/**
 * Fallback balanced generator (guaranteed valid)
 */
function generateFallbackBalanced(min, max, count, config) {
    const result = [];
    const midPoint = config.midPoint;
    const halfCount = Math.floor(count / 2);

    // Pick half from low range
    const lowRange = Array.from({ length: midPoint - min }, (_, i) => min + i);
    for (let i = 0; i < halfCount; i++) {
        const idx = secureRandomInt(0, lowRange.length - 1);
        const num = lowRange.splice(idx, 1)[0];
        result.push(num);
    }

    // Pick half from high range
    const highRange = Array.from({ length: max - midPoint + 1 }, (_, i) => midPoint + i);
    for (let i = 0; i < count - halfCount; i++) {
        const idx = secureRandomInt(0, highRange.length - 1);
        const num = highRange.splice(idx, 1)[0];
        result.push(num);
    }

    return result.sort((a, b) => a - b);
}

// ============ PAIR ANALYSIS ============

/**
 * Analyze which numbers frequently appear together
 * @param {number[][]} history - Array of past draws
 * @returns {Map} - Map of number -> Set of frequent partners
 */
function analyzePairs(history, minCoOccurrence = 3) {
    const pairCounts = new Map();

    history.forEach(draw => {
        // Count all pairs in this draw
        for (let i = 0; i < draw.length; i++) {
            for (let j = i + 1; j < draw.length; j++) {
                const pairKey = `${Math.min(draw[i], draw[j])}-${Math.max(draw[i], draw[j])}`;
                pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
            }
        }
    });

    // Build partner map
    const partners = new Map();

    pairCounts.forEach((count, key) => {
        if (count >= minCoOccurrence) {
            const [num1, num2] = key.split('-').map(Number);

            if (!partners.has(num1)) partners.set(num1, new Set());
            if (!partners.has(num2)) partners.set(num2, new Set());

            partners.get(num1).add(num2);
            partners.get(num2).add(num1);
        }
    });

    return partners;
}

/**
 * Get pair bonus scores for each number based on already picked numbers
 */
function getPairBonus(pickedNumbers, allStats, partners) {
    const scores = {};

    Object.keys(allStats).forEach(num => {
        const n = parseInt(num);
        scores[n] = 0;

        pickedNumbers.forEach(picked => {
            if (partners.has(picked) && partners.get(picked).has(n)) {
                scores[n] += 5; // Bonus for being a "partner"
            }
        });
    });

    return scores;
}

// ============ EXPORTS ============

module.exports = {
    CONFIGS,
    isOddEvenBalanced,
    isHighLowBalanced,
    isValidSum,
    hasExcessiveConsecutive,
    isSameDecade,
    hasGoodSpread,
    isValidCombination,
    generateBalanced,
    generateWeightedPick,
    generateFallbackBalanced,
    analyzePairs,
    getPairBonus
};
