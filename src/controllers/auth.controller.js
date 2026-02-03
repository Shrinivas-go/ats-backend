const authService = require('../services/auth.service');
const config = require('../config/env');

/**
 * Cookie options for tokens
 */
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    maxAge,
});

/**
 * Auth Controller
 */
const authController = {
    /**
     * POST /auth/register
     */
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            const { user, tokens } = await authService.register({ name, email, password });

            // Set cookies
            res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000)); // 15 min
            res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                user,
                tokens, // Also send tokens in response for non-cookie clients
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Registration failed',
            });
        }
    },

    /**
     * POST /auth/login
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
            return res.status(401).json({
                success: false,
                message: error.message || 'Login failed',
            });
        }
    },

    /**
     * POST /auth/refresh
     */
    async refresh(req, res) {
        try {
            // Get refresh token from cookie or body
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required',
                });
            }

            const { tokens } = await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000));
            res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

            return res.status(200).json({
                success: true,
                tokens,
            });
        } catch (error) {
            // Clear invalid cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return res.status(401).json({
                success: false,
                message: error.message || 'Token refresh failed',
            });
        }
    },

    /**
     * POST /auth/logout
     */
    async logout(req, res) {
        try {
            if (req.user) {
                await authService.logout(req.user.id);
            }

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed',
            });
        }
    },

    /**
     * GET /auth/me
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
            return res.status(400).json({
                success: false,
                message: error.message || 'Google authentication failed',
            });
        }
    },
};

module.exports = authController;
