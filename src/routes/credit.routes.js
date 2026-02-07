const express = require('express');
const router = express.Router();
const creditService = require('../services/credit.service');
const paymentService = require('../services/payment.service');
const { auth } = require('../middlewares/auth');

/**
 * Credit Routes
 * Handles credit balance, purchase via Razorpay/Stripe, and history
 */

/**
 * GET /credits/balance
 * Get current user's credit balance
 */
router.get('/balance', auth, async (req, res) => {
    try {
        const balance = await creditService.getBalance(req.user.id);
        res.json({ success: true, ...balance });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ success: false, message: 'Error fetching credit balance' });
    }
});

/**
 * GET /credits/history
 * Get user's credit transaction history
 */
router.get('/history', auth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const transactions = await creditService.getHistory(req.user.id, limit);
        res.json({ success: true, transactions });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ success: false, message: 'Error fetching credit history' });
    }
});

/**
 * GET /credits/packages
 * Get available credit packages for purchase
 */
router.get('/packages', (req, res) => {
    const packages = creditService.getCreditPackages();
    res.json({ success: true, packages });
});

/**
 * GET /credits/scans
 * Get user's scan history
 */
router.get('/scans', auth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const scans = await creditService.getScanHistory(req.user.id, limit);
        res.json({ success: true, scans });
    } catch (error) {
        console.error('Error getting scan history:', error);
        res.status(500).json({ success: false, message: 'Error fetching scan history' });
    }
});

/**
 * POST /credits/purchase
 * Initiate credit purchase - creates Razorpay order or Stripe session
 */
router.post('/purchase', auth, async (req, res) => {
    try {
        const { packageId, gateway = 'razorpay' } = req.body;
        const packages = creditService.getCreditPackages();
        const selectedPackage = packages.find(p => p.id === packageId);

        if (!selectedPackage) {
            return res.status(400).json({ success: false, message: 'Invalid package selected' });
        }

        if (gateway === 'stripe') {
            // Stripe checkout session
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const result = await paymentService.createStripeSession(
                selectedPackage.price * 100, // Convert to smallest unit
                selectedPackage.currency || 'INR',
                req.user.id,
                packageId,
                selectedPackage.credits,
                `${frontendUrl}/pricing?payment=success`,
                `${frontendUrl}/pricing?payment=cancelled`
            );
            return res.json({
                success: true,
                gateway: 'stripe',
                ...result,
            });
        }

        // Default: Razorpay order
        const result = await paymentService.createRazorpayOrder(
            selectedPackage.price,
            req.user.id,
            packageId
        );

        res.json({
            success: true,
            gateway: 'razorpay',
            package: selectedPackage,
            ...result,
        });

    } catch (error) {
        console.error('Error initiating purchase:', error);
        res.status(500).json({ success: false, message: 'Error initiating purchase' });
    }
});

/**
 * POST /credits/verify-razorpay
 * Verify Razorpay payment and add credits
 */
router.post('/verify-razorpay', auth, async (req, res) => {
    try {
        const { orderId, paymentId, signature, packageId } = req.body;

        // Verify signature
        const isValid = paymentService.verifyRazorpayPayment(orderId, paymentId, signature);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        // Get package details
        const packages = creditService.getCreditPackages();
        const selectedPackage = packages.find(p => p.id === packageId);
        if (!selectedPackage) {
            return res.status(400).json({ success: false, message: 'Invalid package' });
        }

        // Add credits to user
        const result = await creditService.addCredits(
            req.user.id,
            selectedPackage.credits,
            'purchase',
            `Purchased ${selectedPackage.credits} credits via Razorpay`,
            paymentId
        );

        res.json({
            success: true,
            message: 'Payment successful! Credits added.',
            credits: selectedPackage.credits,
            newBalance: result.newBalance,
        });

    } catch (error) {
        console.error('Razorpay verification error:', error);
        res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
});

/**
 * POST /credits/webhook/razorpay
 * Razorpay webhook handler (backup verification)
 */
router.post('/webhook/razorpay', express.json(), async (req, res) => {
    try {
        const { event, payload } = req.body;

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const userId = payment.notes?.userId;
            const packageId = payment.notes?.packageId;

            if (userId && packageId) {
                const packages = creditService.getCreditPackages();
                const selectedPackage = packages.find(p => p.id === packageId);

                if (selectedPackage) {
                    await creditService.addCredits(
                        userId,
                        selectedPackage.credits,
                        'purchase',
                        `Razorpay webhook: ${selectedPackage.credits} credits`,
                        payment.id
                    );
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * POST /credits/webhook/stripe
 * Stripe webhook handler
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const event = paymentService.verifyStripeWebhook(req.body, signature);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const data = paymentService.extractStripeSessionData(session);

            await creditService.addCredits(
                data.userId,
                data.credits,
                'purchase',
                `Purchased ${data.credits} credits via Stripe`,
                data.paymentId
            );
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({ error: 'Webhook verification failed' });
    }
});

/**
 * POST /credits/add-demo (Development only)
 * Add demo credits for testing
 */
if (process.env.NODE_ENV !== 'production') {
    router.post('/add-demo', auth, async (req, res) => {
        try {
            const result = await creditService.addCredits(
                req.user.id,
                10,
                'bonus',
                'Demo credits for testing'
            );
            res.json({ success: true, message: 'Demo credits added', ...result });
        } catch (error) {
            console.error('Error adding demo credits:', error);
            res.status(500).json({ success: false, message: 'Error adding demo credits' });
        }
    });
}

module.exports = router;
