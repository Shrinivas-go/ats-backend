const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middlewares/auth');

/**
 * Predefined avatars for profile customization
 * Using professional-looking abstract geometric patterns
 */
const PREDEFINED_AVATARS = [
    { id: 'avatar-1', name: 'Ocean Blue', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'avatar-2', name: 'Sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'avatar-3', name: 'Forest', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'avatar-4', name: 'Fire', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'avatar-5', name: 'Midnight', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { id: 'avatar-6', name: 'Lavender', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'avatar-7', name: 'Emerald', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { id: 'avatar-8', name: 'Coral', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
];

/**
 * GET /profile/avatars
 * Get list of predefined avatars
 */
router.get('/avatars', (req, res) => {
    res.json({
        success: true,
        avatars: PREDEFINED_AVATARS,
    });
});

/**
 * PUT /profile
 * Update user profile (name, location, avatar)
 */
router.put('/', auth, async (req, res) => {
    try {
        const { name, location, selectedAvatar } = req.body;
        const updates = {};

        // Validate and prepare updates
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be between 2 and 50 characters',
                });
            }
            updates.name = name.trim();
        }

        if (location !== undefined) {
            if (typeof location !== 'string' || location.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Location cannot exceed 100 characters',
                });
            }
            updates.location = location.trim();
        }

        if (selectedAvatar !== undefined) {
            // Validate avatar ID
            const validAvatarIds = ['google', ...PREDEFINED_AVATARS.map(a => a.id)];
            if (selectedAvatar !== null && !validAvatarIds.includes(selectedAvatar)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid avatar selection',
                });
            }
            updates.selectedAvatar = selectedAvatar;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update',
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user,
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
        });
    }
});

/**
 * GET /profile
 * Get current user's full profile
 */
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            user,
            avatars: PREDEFINED_AVATARS,
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
        });
    }
});

module.exports = router;
