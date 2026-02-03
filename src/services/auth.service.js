const User = require('../models/User');
const tokenService = require('./token.service');

/**
 * Auth Service - Handles authentication business logic
 */
const authService = {
    /**
     * Register a new user
     */
    async register({ name, email, password }) {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Create user (password hashed by pre-save hook)
        const user = await User.create({ name, email, password });

        // Generate tokens
        const tokens = tokenService.generateTokens(user._id, user.role);

        // Save refresh token to user
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user: user.toJSON(),
            tokens,
        };
    },

    /**
     * Login user
     */
    async login({ email, password }) {
        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const tokens = tokenService.generateTokens(user._id, user.role);

        // Update refresh token and last login
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();

        return {
            user: user.toJSON(),
            tokens,
        };
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        // Verify refresh token
        const decoded = tokenService.verifyRefreshToken(refreshToken);

        // Find user with refresh token
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Generate new tokens
        const tokens = tokenService.generateTokens(user._id, user.role);

        // Update refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return { tokens };
    },

    /**
     * Logout user - invalidate refresh token
     */
    async logout(userId) {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
        return { message: 'Logged out successfully' };
    },

    /**
     * Google OAuth login/register
     * Creates new user if doesn't exist, or logs in existing user
     */
    async googleAuth({ googleId, email, name, avatar }) {
        // Check if user exists by googleId or email
        let user = await User.findOne({
            $or: [
                { googleId },
                { email }
            ]
        });

        if (user) {
            // If user exists with email but no googleId, link the account
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                if (avatar) user.avatar = avatar;
            }

            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Generate tokens
            const tokens = tokenService.generateTokens(user._id, user.role);

            // Update refresh token and last login
            user.refreshToken = tokens.refreshToken;
            user.lastLogin = new Date();
            await user.save();

            return {
                user: user.toJSON(),
                tokens,
                isNewUser: false,
            };
        }

        // Create new user
        user = await User.create({
            name,
            email,
            googleId,
            authProvider: 'google',
            avatar,
        });

        // Generate tokens
        const tokens = tokenService.generateTokens(user._id, user.role);

        // Save refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user: user.toJSON(),
            tokens,
            isNewUser: true,
        };
    },

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    },
};

module.exports = authService;
