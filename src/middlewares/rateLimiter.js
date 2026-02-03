const rateLimit = require('express-rate-limit');
const config = require('../config/env');

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
    keyGenerator: (req) => {
        // Use IP address as key
        return req.ip || req.connection.remoteAddress;
    },
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
});

module.exports = {
    authLimiter,
    apiLimiter,
    uploadLimiter,
};
