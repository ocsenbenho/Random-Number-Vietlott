const crypto = require('crypto');

/**
 * Generate a random integer between min (inclusive) and max (inclusive).
 * Uses crypto.randomInt which is CSPRNG.
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function secureRandomInt(min, max) {
    // crypto.randomInt takes (min, max) where max is exclusive.
    // So we use max + 1.
    return crypto.randomInt(min, max + 1);
}

/**
 * Generate a sorted array of distinct random numbers.
 * @param {number} min 
 * @param {number} max 
 * @param {number} count 
 * @returns {number[]}
 */
function generateMatrix(min, max, count) {
    if (max - min + 1 < count) {
        throw new Error("Range is too small for distinct numbers");
    }
    const numbers = new Set();
    while (numbers.size < count) {
        numbers.add(secureRandomInt(min, max));
    }
    return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Generate an array of random digits (allow duplicates).
 * @param {number} min 
 * @param {number} max 
 * @param {number} count 
 * @returns {number[]}
 */
function generateDigits(min, max, count) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(secureRandomInt(min, max));
    }
    return numbers; // Do not sort for 3D/digits
}

/**
 * Generate an optimized matrix of random numbers using heuristics.
 * Filters:
 * 1. Parity: Avoid all even or all odd (aim for 3/3, 4/2, 2/4).
 * 2. Sum: Keep sum within efficient range (approx 40-60% of max possible sum).
 * 3. Consecutive: Avoid long sequences (max 3 consecutive numbers).
 * 
 * @param {number} min 
 * @param {number} max 
 * @param {number} count 
 * @returns {number[]}
 */
function generateOptimizedMatrix(min, max, count) {
    // Safety check: if range is small, strict filters might cause infinite loop
    if (max - min + 1 < count * 2) {
        return generateMatrix(min, max, count); // Fallback to pure random
    }

    let result = [];
    let isValid = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 500; // Fail-safe to avoid hang

    while (!isValid && attempts < MAX_ATTEMPTS) {
        attempts++;
        result = generateMatrix(min, max, count);

        // 1. Parity Check
        const evenCount = result.filter(n => n % 2 === 0).length;
        const oddCount = count - evenCount;
        // Accept only if neither is 0 (i.e., not all even or all odd)
        // For count=6, ideal is 3-3, 2-4, 4-2. 0-6 or 6-0 are rejected.
        // For count=5, ideal is 2-3, 3-2. 0-5 or 5-0 rejected.
        if (evenCount === 0 || oddCount === 0) continue;

        // 2. Sum Check (Heuristic)
        // Calculate theoretical min/max sum
        // For 6/45: Min sum (1..6) = 21, Max sum (40..45) = 255. Avg ~ 138.
        // Good range is roughly +/- 30% from average.
        const sum = result.reduce((a, b) => a + b, 0);
        // Estimate average sum
        const avgNum = (min + max) / 2;
        const targetSum = avgNum * count;
        const lowBound = targetSum * 0.65;
        const highBound = targetSum * 1.35;

        if (sum < lowBound || sum > highBound) continue;

        // 3. Consecutive Sequence Check
        // Reject if there are more than 3 consecutive numbers (e.g. 1,2,3,4)
        let maxConsecutive = 1;
        let currentConsecutive = 1;
        for (let i = 0; i < count - 1; i++) {
            if (result[i + 1] === result[i] + 1) {
                currentConsecutive++;
            } else {
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
                currentConsecutive = 1;
            }
        }
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);

        if (maxConsecutive > 3) continue;

        isValid = true;
    }

    return result;
}

module.exports = { secureRandomInt, generateMatrix, generateDigits, generateOptimizedMatrix };
