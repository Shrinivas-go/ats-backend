const config = require('../config/env');

/**
 * Admin Emails - Users with these emails get admin privileges
 * Bypasses all credit/paywall checks
 */
const ADMIN_EMAILS = [
    'shrinivas4927@gmail.com',
    // Add more admin emails here as needed
];

/**
 * Check if a user email is an admin/tester
 * @param {string} email - User email to check
 * @returns {boolean}
 */
const isAdminEmail = (email) => {
    if (!email) return false;

    // Check environment variable first (for production flexibility)
    const envAdminEmail = process.env.ADMIN_EMAIL;
    if (envAdminEmail && email.toLowerCase() === envAdminEmail.toLowerCase()) {
        return true;
    }

    // Check hardcoded list
    return ADMIN_EMAILS.some(
        adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
    );
};

/**
 * Middleware: Check if user is admin
 * Adds `req.isAdmin` boolean to request
 */
const checkAdmin = (req, res, next) => {
    if (req.user && isAdminEmail(req.user.email)) {
        req.isAdmin = true;
        req.user.isAdmin = true;
    } else {
        req.isAdmin = false;
    }
    next();
};

/**
 * Middleware: Require admin access
 * Returns 403 if not admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || !isAdminEmail(req.user.email)) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED',
        });
    }
    req.isAdmin = true;
    next();
};

/**
 * Middleware: Bypass paywall for admins
 * Continues to next middleware for admins, checks credits for regular users
 * Usage: app.use('/premium-feature', auth, bypassPaywall, checkCredits)
 */
const bypassPaywall = (req, res, next) => {
    if (req.user && isAdminEmail(req.user.email)) {
        req.isAdmin = true;
        req.bypassPaywall = true;
        console.log(`Admin bypass activated for: ${req.user.email}`);
        return next();
    }
    req.bypassPaywall = false;
    next();
};

module.exports = {
    ADMIN_EMAILS,
    isAdminEmail,
    checkAdmin,
    requireAdmin,
    bypassPaywall,
};
