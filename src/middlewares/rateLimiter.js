const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const config = require('../config/env');

/**
 * IPv6-safe key generator
 * Uses express-rate-limit's built-in helper to handle IPv6 properly
 */
const getKeyGenerator = () => {
    // Check if ipKeyGenerator exists (newer versions)
    if (typeof ipKeyGenerator === 'function') {
        return ipKeyGenerator;
    }
    // Fallback for older versions - use default behavior
    return undefined;
};

/**
 * Auth rate limiter - stricter limits for login/register
 */
const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs, // 15 minutes
    max: config.rateLimit.maxRequests, // 5 requests per window
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: getKeyGenerator(),
    validate: { xForwardedForHeader: false, trustProxy: false, default: false },
});

/**
 * General API rate limiter - less strict
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getKeyGenerator(),
    validate: { xForwardedForHeader: false, trustProxy: false, default: false },
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getKeyGenerator(),
    validate: { xForwardedForHeader: false, trustProxy: false, default: false },
});

module.exports = {
    authLimiter,
    apiLimiter,
    uploadLimiter,
};

