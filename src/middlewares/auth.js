const tokenService = require('../services/token.service');
const User = require('../models/User');
const { isAdminEmail } = require('./admin');

/**
 * Authentication Middleware - Production-grade token verification
 * 
 * Features:
 * - Consistent 401 responses (never 500 for auth failures)
 * - Specific error messages for debugging
 * - DB-backed user validation
 * - Supports both cookie and header-based tokens
 * - Admin bypass detection
 */

/**
 * Primary authentication middleware - verifies JWT access token
 * Returns 401 for all auth failures with specific error codes
 */
const auth = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookie
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN',
            });
        }

        // Verify token - will throw specific errors for different failure modes
        let decoded;
        try {
            decoded = tokenService.verifyAccessToken(token);
        } catch (tokenError) {
            // Handle token-specific errors with appropriate codes
            if (tokenError.code === 'TOKEN_EXPIRED') {
                return res.status(401).json({
                    success: false,
                    message: 'Access token has expired. Please refresh your session.',
                    code: 'TOKEN_EXPIRED',
                });
            }
            return res.status(401).json({
                success: false,
                message: tokenError.message || 'Invalid token.',
                code: tokenError.code || 'TOKEN_INVALID',
            });
        }

        // Validate user exists in database and is active
        // This prevents tokens from working for deleted/deactivated users
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User account not found.',
                code: 'USER_NOT_FOUND',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account has been deactivated.',
                code: 'USER_DEACTIVATED',
            });
        }

        // Check if user is admin based on email
        const isAdmin = isAdminEmail(user.email);

        // Attach user info to request for downstream handlers
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            isAdmin,
            bypassPaywall: isAdmin, // Admins bypass all paywalls
        };

        next();
    } catch (error) {
        // Catch-all for unexpected errors - still return 401 for security
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed.',
            code: 'AUTH_ERROR',
        });
    }
};

/**
 * Role authorization middleware
 * Must be used after auth middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'NO_AUTH',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                code: 'FORBIDDEN',
            });
        }

        next();
    };
};

/**
 * Optional auth - attaches user if token present, but doesn't require it
 * Useful for routes that show different content based on auth status
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            try {
                const decoded = tokenService.verifyAccessToken(token);
                const user = await User.findById(decoded.userId);

                if (user && user.isActive) {
                    const isAdmin = isAdminEmail(user.email);
                    req.user = {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        isAdmin,
                        bypassPaywall: isAdmin,
                    };
                }
            } catch {
                // Token invalid, but that's okay for optional auth
                // Just proceed without user
            }
        }

        next();
    } catch (error) {
        // Don't fail request for optional auth errors
        next();
    }
};

module.exports = {
    auth,
    authorize,
    optionalAuth,
};
