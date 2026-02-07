/**
 * Database Readiness Middleware
 * 
 * Blocks requests when MongoDB is not connected.
 * Returns 503 Service Unavailable with clear error message.
 * Critical for ensuring auth operations don't fail silently.
 */

const { isDbConnected } = require('../config/database');

/**
 * Middleware to check database availability before processing request
 */
const dbReady = (req, res, next) => {
    if (!isDbConnected()) {
        console.warn(`⚠️ Request blocked - DB unavailable: ${req.method} ${req.path}`);
        return res.status(503).json({
            success: false,
            message: 'Database temporarily unavailable. Please try again in a moment.',
            code: 'DB_UNAVAILABLE',
        });
    }
    next();
};

module.exports = { dbReady };
