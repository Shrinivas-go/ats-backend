const { z } = require('zod');

// Registration validation schema
const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .trim(),
    email: z
        .string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(128, 'Password cannot exceed 128 characters'),
});

// Login validation schema
const loginSchema = z.object({
    email: z
        .string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(1, 'Password is required'),
});

// Refresh token validation
const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
};
