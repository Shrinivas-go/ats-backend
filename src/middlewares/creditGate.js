const creditService = require('../services/credit.service');
const { isAdminEmail } = require('./admin');

/**
 * Credit Gate Middleware
 * Controls access to paid features based on credits
 */

/**
 * Get client IP address from request
 */
function getClientIP(req) {
    // Get IP from various headers (for reverse proxy scenarios)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Middleware to check if user can perform a scan
 * - Anonymous: First scan free (tracked by IP)
 * - Authenticated: Uses credits
 * - Admin: Unlimited access
 */
const requireCreditsForScan = async (req, res, next) => {
    try {
        const clientIP = getClientIP(req);

        // Check if user is authenticated
        if (req.user && req.user.id) {
            // Authenticated user - check credits
            const canScan = await creditService.canScan(req.user.id);

            if (!canScan.allowed) {
                return res.status(402).json({
                    success: false,
                    error: 'insufficient_credits',
                    message: 'You have run out of credits. Please purchase more to continue.',
                    credits: 0,
                });
            }

            // Attach credit info to request for later use
            req.creditInfo = {
                userId: req.user.id,
                isAuthenticated: true,
                isAdmin: canScan.unlimited,
                credits: canScan.credits,
                shouldCharge: !canScan.unlimited,
                ipAddress: clientIP,
            };

            return next();
        }

        // Anonymous user - check if they've used their free scan
        const hasUsedFree = await creditService.hasUsedFreeScan(clientIP);

        if (hasUsedFree) {
            return res.status(401).json({
                success: false,
                error: 'login_required',
                message: 'You\'ve used your free scan. Please sign up or log in to continue.',
                freeScansRemaining: 0,
            });
        }

        // Allow free scan for anonymous user
        req.creditInfo = {
            userId: null,
            isAuthenticated: false,
            isAdmin: false,
            credits: 0,
            shouldCharge: false,
            isFreeScan: true,
            ipAddress: clientIP,
        };

        return next();

    } catch (error) {
        console.error('Credit gate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking credit status',
        });
    }
};

/**
 * After scan completes - deduct credit and record scan
 * Call this after successful scan response
 */
const recordScanUsage = async (req, scanResult) => {
    try {
        const { creditInfo } = req;
        if (!creditInfo) return;

        // Record the scan
        const scanRecord = await creditService.recordScan({
            userId: creditInfo.userId,
            ipAddress: creditInfo.ipAddress,
            filename: req.file?.originalname || 'unknown',
            fileSize: req.file?.size,
            score: scanResult?.overallScore,
            coreSkillsMatch: scanResult?.coreSkillsMatch,
            optionalSkillsMatch: scanResult?.optionalSkillsMatch,
            jobTitle: req.body?.jobTitle,
            creditCharged: creditInfo.shouldCharge,
            freeScan: creditInfo.isFreeScan || false,
        });

        // Deduct credit if needed
        if (creditInfo.shouldCharge && creditInfo.userId) {
            await creditService.deductCredits(
                creditInfo.userId,
                1,
                'Resume ATS analysis',
                scanRecord._id
            );
        }

        return scanRecord;

    } catch (error) {
        console.error('Error recording scan usage:', error);
        // Don't throw - scan was successful, just logging failed
    }
};

/**
 * Middleware to require authentication for credit operations
 */
const requireAuthForCredits = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }
    next();
};

module.exports = {
    requireCreditsForScan,
    recordScanUsage,
    requireAuthForCredits,
    getClientIP,
};
