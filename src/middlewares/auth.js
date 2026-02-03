const tokenService = require('../services/token.service');
const User = require('../models/User');

/**
 * Authentication middleware - verifies JWT access token
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
            });
        }

        // Verify token
        const decoded = tokenService.verifyAccessToken(token);

        // Get user
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or deactivated.',
            });
        }

        // Attach user to request
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.',
        });
    }
};

/**
 * Role authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
            });
        }

        next();
    };
};

/**
 * Optional auth - attaches user if token present, but doesn't require it
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
            const decoded = tokenService.verifyAccessToken(token);
            const user = await User.findById(decoded.userId);
            if (user && user.isActive) {
                req.user = {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                };
            }
        }

        next();
    } catch (error) {
        // Token invalid, but that's okay for optional auth
        next();
    }
};

module.exports = {
    auth,
    authorize,
    optionalAuth,
};
