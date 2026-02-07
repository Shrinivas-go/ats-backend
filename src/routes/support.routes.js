const express = require('express');
const router = express.Router();
const { sendSupportEmail, isEmailConfigured } = require('../services/email.service');

/**
 * Support Routes
 * Handles support contact form submissions
 */

// Rate limiting for support form (simple in-memory, use Redis for production)
const supportRequests = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

const checkRateLimit = (email) => {
    const now = Date.now();
    const userRequests = supportRequests.get(email) || [];

    // Clean old requests
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= MAX_REQUESTS) {
        return false;
    }

    recentRequests.push(now);
    supportRequests.set(email, recentRequests);
    return true;
};

/**
 * POST /support/contact
 * Submit a support request
 */
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required',
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Message length validation
        if (message.length < 10 || message.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Message must be between 10 and 5000 characters',
            });
        }

        // Rate limiting
        if (!checkRateLimit(email)) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
            });
        }

        // Send email
        const result = await sendSupportEmail({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject?.trim() || 'Support Request',
            message: message.trim(),
        });

        res.json({
            success: true,
            message: 'Your message has been sent. We\'ll get back to you soon!',
            ...(result.dev && { dev: true }),
        });

    } catch (error) {
        console.error('Support contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.',
        });
    }
});

/**
 * GET /support/status
 * Check if email is configured (for admin/debug)
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        emailConfigured: isEmailConfigured(),
        mode: isEmailConfigured() ? 'production' : 'development',
    });
});

module.exports = router;
