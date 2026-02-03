const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Token Service - Handles JWT generation and verification
 */
const tokenService = {
    /**
     * Generate access token
     */
    generateAccessToken(userId, role = 'user') {
        return jwt.sign(
            { userId, role, type: 'access' },
            config.jwt.accessSecret,
            { expiresIn: config.jwt.accessExpiresIn }
        );
    },

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId) {
        return jwt.sign(
            { userId, type: 'refresh' },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn }
        );
    },

    /**
     * Generate both tokens
     */
    generateTokens(userId, role = 'user') {
        return {
            accessToken: this.generateAccessToken(userId, role),
            refreshToken: this.generateRefreshToken(userId),
        };
    },

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret);
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    },

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwt.refreshSecret);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    },
};

module.exports = tokenService;
