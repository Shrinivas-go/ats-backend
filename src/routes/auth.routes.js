const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { auth } = require('../middlewares/auth');
const { dbReady } = require('../middlewares/dbReady');
const { authLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    dbReady,
    authLimiter,
    validate(registerSchema),
    authController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    dbReady,
    authLimiter,
    validate(loginSchema),
    authController.login
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post('/refresh', dbReady, authController.refresh);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth, authController.logout);

/**
 * @route   GET /auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth, authController.me);

/**
 * @route   POST /auth/google
 * @desc    Google OAuth login/register
 * @access  Public
 */
router.post('/google', dbReady, authLimiter, authController.googleAuth);

module.exports = router;
