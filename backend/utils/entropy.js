/**
 * Enhanced Entropy Sources for True Random Number Generation
 * 
 * Sources:
 * 1. Random.org API - Atmospheric noise
 * 2. System crypto - Node.js crypto module
 * 3. User entropy - Mouse/keyboard from frontend (if provided)
 */

const crypto = require('crypto');

// Random.org API configuration
const RANDOM_ORG_URL = 'https://www.random.org/integers/';
const RANDOM_ORG_QUOTA_URL = 'https://www.random.org/quota/?format=plain';

// Entropy pool for mixing multiple sources
class EntropyPool {
    constructor() {
        this.pool = [];
        this.userEntropy = [];
        this.lastExternalFetch = 0;
        this.externalCache = [];
    }

    // Add bytes to the entropy pool
    addEntropy(source, bytes) {
        this.pool.push({
            source,
            bytes: Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes),
            timestamp: Date.now()
        });

        // Keep pool size reasonable
        if (this.pool.length > 100) {
            this.pool.shift();
        }
    }

    // Add user entropy from frontend
    addUserEntropy(data) {
        // data: { mouseX, mouseY, timestamp, keyTiming }
        const entropyBits = this._extractUserEntropyBits(data);
        this.userEntropy.push(entropyBits);

        if (this.userEntropy.length > 50) {
            this.userEntropy.shift();
        }
    }

    _extractUserEntropyBits(data) {
        // Extract low bits from user input (most random part)
        const bits = [];
        if (data.mouseX !== undefined) bits.push(data.mouseX & 0xFF);
        if (data.mouseY !== undefined) bits.push(data.mouseY & 0xFF);
        if (data.timestamp) bits.push(data.timestamp & 0xFF);
        if (data.keyTiming) bits.push(data.keyTiming & 0xFF);
        return Buffer.from(bits);
    }

    // Mix all entropy sources into a seed
    mixEntropy() {
        const allBytes = [];

        // Add system crypto randomness
        allBytes.push(crypto.randomBytes(16));

        // Add timestamp entropy
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeBigInt64BE(BigInt(Date.now()));
        allBytes.push(timeBuffer);

        // Add process entropy
        const processBuffer = Buffer.alloc(4);
        processBuffer.writeUInt32BE(process.hrtime.bigint() & 0xFFFFFFFFn);
        allBytes.push(processBuffer);

        // Add pool entropy
        this.pool.slice(-10).forEach(entry => {
            allBytes.push(entry.bytes);
        });

        // Add user entropy
        this.userEntropy.slice(-5).forEach(bytes => {
            allBytes.push(bytes);
        });

        // Hash everything together
        const combined = Buffer.concat(allBytes);
        return crypto.createHash('sha256').update(combined).digest();
    }

    // Generate a random integer using mixed entropy
    randomInt(min, max) {
        const seed = this.mixEntropy();
        const range = max - min + 1;

        // Use seed bytes to generate uniform distribution
        const randomValue = seed.readUInt32BE(0);
        return min + (randomValue % range);
    }
}

/**
 * Fetch random numbers from Random.org API
 * Free tier: 1,000,000 bits/day
 */
async function fetchFromRandomOrg(count, min, max) {
    try {
        const url = new URL(RANDOM_ORG_URL);
        url.searchParams.set('num', count);
        url.searchParams.set('min', min);
        url.searchParams.set('max', max);
        url.searchParams.set('col', 1);
        url.searchParams.set('base', 10);
        url.searchParams.set('format', 'plain');
        url.searchParams.set('rnd', 'new');

        const response = await fetch(url.toString(), {
            timeout: 5000,
            headers: {
                'User-Agent': 'VietlottRandomGenerator/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Random.org API error: ${response.status}`);
        }

        const text = await response.text();
        const numbers = text.trim().split('\n').map(n => parseInt(n, 10));

        console.log(`[Entropy] Fetched ${numbers.length} numbers from Random.org`);
        return numbers;
    } catch (error) {
        console.warn(`[Entropy] Random.org failed: ${error.message}`);
        return null;
    }
}

/**
 * Check Random.org quota
 */
async function checkRandomOrgQuota() {
    try {
        const response = await fetch(RANDOM_ORG_QUOTA_URL, { timeout: 3000 });
        const quota = parseInt(await response.text(), 10);
        return quota;
    } catch (error) {
        return -1;
    }
}

// Global entropy pool instance
const entropyPool = new EntropyPool();

/**
 * Generate enhanced random numbers using multiple entropy sources
 */
async function generateEnhancedDraw(min, max, count, useExternal = true) {
    const results = new Set();
    const range = max - min + 1;

    if (range < count) {
        throw new Error("Range is too small for distinct numbers");
    }

    // Try Random.org first if enabled
    if (useExternal) {
        const externalNumbers = await fetchFromRandomOrg(count + 5, min, max);
        if (externalNumbers && externalNumbers.length > 0) {
            // Add to pool for mixing
            entropyPool.addEntropy('random.org', Buffer.from(externalNumbers));

            // Use external numbers directly if we have enough unique ones
            for (const num of externalNumbers) {
                if (results.size < count && num >= min && num <= max) {
                    results.add(num);
                }
            }
        }
    }

    // Fill remaining with mixed entropy
    while (results.size < count) {
        const num = entropyPool.randomInt(min, max);
        results.add(num);
    }

    return Array.from(results).sort((a, b) => a - b);
}

/**
 * Generate enhanced draw without sorting (for special numbers)
 */
async function generateEnhancedDrawUnsorted(min, max, count, useExternal = true) {
    const results = [];
    const picked = new Set();
    const range = max - min + 1;

    if (range < count) {
        throw new Error("Range is too small for distinct numbers");
    }

    // Try Random.org first
    if (useExternal) {
        const externalNumbers = await fetchFromRandomOrg(count + 5, min, max);
        if (externalNumbers && externalNumbers.length > 0) {
            entropyPool.addEntropy('random.org', Buffer.from(externalNumbers));

            for (const num of externalNumbers) {
                if (results.length < count && num >= min && num <= max && !picked.has(num)) {
                    picked.add(num);
                    results.push(num);
                }
            }
        }
    }

    // Fill remaining
    while (results.length < count) {
        const num = entropyPool.randomInt(min, max);
        if (!picked.has(num)) {
            picked.add(num);
            results.push(num);
        }
    }

    return results;
}

module.exports = {
    EntropyPool,
    entropyPool,
    fetchFromRandomOrg,
    checkRandomOrgQuota,
    generateEnhancedDraw,
    generateEnhancedDrawUnsorted
};
