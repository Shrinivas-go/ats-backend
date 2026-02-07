const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Token Service - Handles JWT generation and verification
 * 
 * Production-grade features:
 * - Explicit expiration times (no implicit defaults)
 * - Clock skew tolerance (30 seconds)
 * - Specific error types for different failure modes
 * - Type validation in token payloads
 */

// Token expiration times - explicitly defined
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Clock skew tolerance in seconds (handles minor time sync issues)
const CLOCK_TOLERANCE = 30;

/**
 * Custom error types for specific token failures
 */
class TokenExpiredError extends Error {
    constructor(message = 'Token has expired') {
        super(message);
        this.name = 'TokenExpiredError';
        this.code = 'TOKEN_EXPIRED';
    }
}

class TokenInvalidError extends Error {
    constructor(message = 'Token is invalid') {
        super(message);
        this.name = 'TokenInvalidError';
        this.code = 'TOKEN_INVALID';
    }
}

const tokenService = {
    /**
     * Generate access token with explicit expiry
     * @param {string} userId - User's database ID
     * @param {string} role - User's role (default: 'user')
     * @returns {string} JWT access token
     */
    generateAccessToken(userId, role = 'user') {
        if (!userId) {
            throw new Error('userId is required to generate access token');
        }

        return jwt.sign(
            {
                userId,
                role,
                type: 'access',
                iat: Math.floor(Date.now() / 1000), // Explicit issued-at time
            },
            config.jwt.accessSecret,
            {
                expiresIn: config.jwt.accessExpiresIn || ACCESS_TOKEN_EXPIRY,
            }
        );
    },

    /**
     * Generate refresh token with explicit expiry
     * @param {string} userId - User's database ID
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(userId) {
        if (!userId) {
            throw new Error('userId is required to generate refresh token');
        }

        return jwt.sign(
            {
                userId,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000), // Explicit issued-at time
            },
            config.jwt.refreshSecret,
            {
                expiresIn: config.jwt.refreshExpiresIn || REFRESH_TOKEN_EXPIRY,
            }
        );
    },

    /**
     * Generate both access and refresh tokens
     * @param {string} userId - User's database ID
     * @param {string} role - User's role (default: 'user')
     * @returns {{accessToken: string, refreshToken: string}}
     */
    generateTokens(userId, role = 'user') {
        return {
            accessToken: this.generateAccessToken(userId, role),
            refreshToken: this.generateRefreshToken(userId),
        };
    },

    /**
     * Verify access token with clock skew tolerance
     * @param {string} token - JWT access token
     * @returns {object} Decoded token payload
     * @throws {TokenExpiredError} If token is expired
     * @throws {TokenInvalidError} If token is invalid or malformed
     */
    verifyAccessToken(token) {
        if (!token) {
            throw new TokenInvalidError('No token provided');
        }

        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret, {
                clockTolerance: CLOCK_TOLERANCE, // Handle minor clock skew
            });

            // Validate token type
            if (decoded.type !== 'access') {
                throw new TokenInvalidError('Invalid token type - expected access token');
            }

            return decoded;
        } catch (error) {
            // Handle specific JWT errors
            if (error.name === 'TokenExpiredError') {
                throw new TokenExpiredError('Access token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new TokenInvalidError(`Invalid access token: ${error.message}`);
            }
            if (error.name === 'NotBeforeError') {
                throw new TokenInvalidError('Token is not yet valid');
            }
            // Re-throw custom errors as-is
            if (error instanceof TokenInvalidError || error instanceof TokenExpiredError) {
                throw error;
            }
            // Unknown error
            throw new TokenInvalidError('Failed to verify access token');
        }
    },

    /**
     * Verify refresh token with clock skew tolerance
     * @param {string} token - JWT refresh token
     * @returns {object} Decoded token payload
     * @throws {TokenExpiredError} If token is expired
     * @throws {TokenInvalidError} If token is invalid or malformed
     */
    verifyRefreshToken(token) {
        if (!token) {
            throw new TokenInvalidError('No token provided');
        }

        try {
            const decoded = jwt.verify(token, config.jwt.refreshSecret, {
                clockTolerance: CLOCK_TOLERANCE, // Handle minor clock skew
            });

            // Validate token type
            if (decoded.type !== 'refresh') {
                throw new TokenInvalidError('Invalid token type - expected refresh token');
            }

            return decoded;
        } catch (error) {
            // Handle specific JWT errors
            if (error.name === 'TokenExpiredError') {
                throw new TokenExpiredError('Refresh token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new TokenInvalidError(`Invalid refresh token: ${error.message}`);
            }
            if (error.name === 'NotBeforeError') {
                throw new TokenInvalidError('Token is not yet valid');
            }
            // Re-throw custom errors as-is
            if (error instanceof TokenInvalidError || error instanceof TokenExpiredError) {
                throw error;
            }
            // Unknown error
            throw new TokenInvalidError('Failed to verify refresh token');
        }
    },

    /**
     * Decode token without verification (for debugging/logging)
     * WARNING: Do not use for authentication - use verify methods instead
     * @param {string} token - JWT token
     * @returns {object|null} Decoded payload or null if invalid
     */
    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch {
            return null;
        }
    },

    // Export error classes for use in other modules
    TokenExpiredError,
    TokenInvalidError,
};

module.exports = tokenService;
