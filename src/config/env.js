const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,

    mongodb: {
        uri: process.env.MONGODB_URI,
        retryAttempts: parseInt(process.env.MONGODB_RETRY_ATTEMPTS, 10) || 5,
        retryDelay: parseInt(process.env.MONGODB_RETRY_DELAY, 10) || 1000, // Base delay in ms
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    cors: {
        // Support multiple origins separated by comma
        // Example: "http://localhost:5173,https://your-app.vercel.app"
        frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173,https://ats-resume-checker-coral.vercel.app')
            .split(',')
            .map(url => url.trim().replace(/\/$/, '')) // Remove trailing slash
            .filter(Boolean),
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 5,
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
};

module.exports = config;
