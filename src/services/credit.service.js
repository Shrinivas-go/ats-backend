const User = require('../models/User');
const Credit = require('../models/Credit');
const ScanHistory = require('../models/ScanHistory');
const { isAdminEmail } = require('../middlewares/admin');

/**
 * Credit Service
 * Handles all credit-related operations
 */

/**
 * Get user's current credit balance
 */
async function getBalance(userId) {
    const user = await User.findById(userId).select('credits email');
    if (!user) {
        throw new Error('User not found');
    }

    return {
        credits: user.credits,
        isAdmin: isAdminEmail(user.email),
        unlimited: isAdminEmail(user.email),
    };
}

/**
 * Deduct credits for an action
 * Returns true if successful, throws error if insufficient
 */
async function deductCredits(userId, amount, description, relatedScanId = null) {
    const user = await User.findById(userId).select('credits email');
    if (!user) {
        throw new Error('User not found');
    }

    // Admin bypass - don't deduct credits
    if (isAdminEmail(user.email)) {
        return {
            success: true,
            newBalance: user.credits,
            bypassed: true
        };
    }

    if (user.credits < amount) {
        throw new Error('Insufficient credits');
    }

    // Deduct credits
    const newBalance = user.credits - amount;
    await User.findByIdAndUpdate(userId, {
        credits: newBalance,
        $inc: { totalScans: 1 }
    });

    // Log transaction
    await Credit.create({
        userId,
        amount: -amount,
        type: 'usage',
        description,
        relatedScan: relatedScanId,
        balanceAfter: newBalance,
    });

    return {
        success: true,
        newBalance,
        bypassed: false
    };
}

/**
 * Add credits to user account
 * Used for purchases, bonuses, refunds
 */
async function addCredits(userId, amount, type, description, paymentId = null) {
    const user = await User.findById(userId).select('credits');
    if (!user) {
        throw new Error('User not found');
    }

    const newBalance = user.credits + amount;
    await User.findByIdAndUpdate(userId, { credits: newBalance });

    // Log transaction
    await Credit.create({
        userId,
        amount,
        type,
        description,
        paymentId,
        balanceAfter: newBalance,
    });

    return {
        success: true,
        newBalance,
        creditsAdded: amount,
    };
}

/**
 * Get user's credit transaction history
 */
async function getHistory(userId, limit = 20) {
    const transactions = await Credit.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return transactions;
}

/**
 * Check if user can perform a scan
 * Returns { allowed, reason, credits }
 */
async function canScan(userId) {
    const user = await User.findById(userId).select('credits email');
    if (!user) {
        throw new Error('User not found');
    }

    // Admin bypass
    if (isAdminEmail(user.email)) {
        return {
            allowed: true,
            reason: 'admin',
            credits: user.credits,
            unlimited: true,
        };
    }

    if (user.credits < 1) {
        return {
            allowed: false,
            reason: 'insufficient_credits',
            credits: 0,
            unlimited: false,
        };
    }

    return {
        allowed: true,
        reason: 'has_credits',
        credits: user.credits,
        unlimited: false,
    };
}

/**
 * Check if anonymous user has used free scan (by IP)
 */
async function hasUsedFreeScan(ipAddress) {
    return ScanHistory.hasUsedFreeScan(ipAddress);
}

/**
 * Record a scan in history
 */
async function recordScan(data) {
    const { userId, ipAddress, filename, fileSize, score, coreSkillsMatch, optionalSkillsMatch, jobTitle, creditCharged, freeScan } = data;

    const scan = await ScanHistory.create({
        userId: userId || null,
        ipAddress,
        filename,
        fileSize,
        score,
        coreSkillsMatch,
        optionalSkillsMatch,
        jobTitle,
        creditCharged,
        freeScan,
    });

    return scan;
}

/**
 * Get user's scan history
 */
async function getScanHistory(userId, limit = 10) {
    const scans = await ScanHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return scans;
}

/**
 * Credit packages for purchase
 */
const CREDIT_PACKAGES = [
    { id: 'starter', credits: 10, price: 99, currency: 'INR', label: 'Starter' },
    { id: 'popular', credits: 50, price: 399, currency: 'INR', label: 'Popular', recommended: true },
    { id: 'pro', credits: 100, price: 699, currency: 'INR', label: 'Pro' },
];

function getCreditPackages() {
    return CREDIT_PACKAGES;
}

module.exports = {
    getBalance,
    deductCredits,
    addCredits,
    getHistory,
    canScan,
    hasUsedFreeScan,
    recordScan,
    getScanHistory,
    getCreditPackages,
};
