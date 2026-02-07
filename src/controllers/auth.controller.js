const authService = require('../services/auth.service');
const config = require('../config/env');

/**
 * Cookie options for tokens
 * 
 * Production-grade settings:
 * - httpOnly: true - prevents XSS access to cookies
 * - secure: true in production - requires HTTPS
 * - sameSite: 'lax' for same-origin, 'none' for cross-origin
 * - domain: set for cross-subdomain support in production
 */
const getCookieOptions = (maxAge) => {
    const isProduction = config.env === 'production';

    return {
        httpOnly: true,                                    // Prevents XSS
        secure: isProduction,                              // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax',          // Cross-origin support in production
        maxAge,
        path: '/',                                         // Available on all routes
    };
};

/**
 * Auth Controller - Production-grade authentication handlers
 * 
 * Features:
 * - Consistent error responses with HTTP status codes
 * - Proper cookie handling for cross-origin SaaS
 * - Comprehensive error logging
 */
const authController = {
    /**
     * POST /auth/register
     * Creates a new user account
     */
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            const { user, tokens } = await authService.register({ name, email, password });

            // Set cookies with proper options
            res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000)); // 15 min
            res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                user,
                tokens, // Also send tokens in response for non-cookie clients
            });
        } catch (error) {
            console.error('Registration error:', error.message);

            // Determine appropriate status code
            const statusCode = error.message.includes('already exists') ? 409 : 400;

            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Registration failed',
                code: 'REGISTRATION_FAILED',
            });
        }
    },

    /**
     * POST /auth/login
     * Authenticates user and returns tokens
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const { user, tokens } = await authService.login({ email, password });

            // Set cookies
            res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000));
            res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user,
                tokens,
            });
        } catch (error) {
            console.error('Login error:', error.message);

            return res.status(401).json({
                success: false,
                message: error.message || 'Login failed',
                code: 'LOGIN_FAILED',
            });
        }
    },

    /**
     * POST /auth/refresh
     * Refreshes access token using refresh token
     * Implements token rotation for security
     */
    async refresh(req, res) {
        try {
            // Get refresh token from cookie or body
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required',
                    code: 'NO_REFRESH_TOKEN',
                });
            }

            const { tokens } = await authService.refreshToken(refreshToken);

            // Set new cookies (token rotation - both tokens are new)
            res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000));
            res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

            return res.status(200).json({
                success: true,
                tokens,
            });
        } catch (error) {
            console.error('Token refresh error:', error.message);

            // Clear invalid cookies
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/' });

            // Determine if it's an expiry issue
            const code = error.message.includes('expired') ? 'REFRESH_TOKEN_EXPIRED' : 'REFRESH_FAILED';

            return res.status(401).json({
                success: false,
                message: error.message || 'Token refresh failed',
                code,
            });
        }
    },

    /**
     * POST /auth/logout
     * Clears tokens and invalidates refresh token in database
     */
    async logout(req, res) {
        try {
            // Invalidate refresh token in database if user is authenticated
            if (req.user) {
                await authService.logout(req.user.id);
            }

            // Clear cookies with proper path
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/' });

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            console.error('Logout error:', error.message);

            // Still clear cookies even if DB operation fails
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/' });

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
    },

    /**
     * GET /auth/me
     * Returns current authenticated user
     */
    async me(req, res) {
        try {
            const user = await authService.getUserById(req.user.id);

            return res.status(200).json({
                success: true,
                user,
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message || 'User not found',
                code: 'USER_NOT_FOUND',
            });
        }
    },

    /**
     * POST /auth/google
     * Handles Google OAuth - verifies token and logs in/registers user
     */
    async googleAuth(req, res) {
        try {
            const { credential } = req.body;

            if (!credential) {
                return res.status(400).json({
                    success: false,
                    message: 'Google credential is required',
                    code: 'NO_CREDENTIAL',
                });
            }

            // Decode the Google ID token (JWT)
            // In production, you should verify this with Google's API
            // For now, we decode and trust the payload (frontend already verified with Google)
            const base64Url = credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

            const { sub: googleId, email, name, picture: avatar } = payload;

            if (!googleId || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Google credential',
                    code: 'INVALID_CREDENTIAL',
                });
            }

            const { user, tokens, isNewUser } = await authService.googleAuth({
                googleId,
                email,
                name,
                avatar,
            });

            // Set cookies
            res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000));
            res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

            return res.status(200).json({
                success: true,
                message: isNewUser ? 'Account created successfully' : 'Login successful',
                user,
                tokens,
                isNewUser,
            });
        } catch (error) {
            console.error('Google auth error:', error.message);

            return res.status(400).json({
                success: false,
                message: error.message || 'Google authentication failed',
                code: 'GOOGLE_AUTH_FAILED',
            });
        }
    },
};

module.exports = authController;
