const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');

/**
 * Payment Service
 * Handles Razorpay and Stripe payment integration
 */

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in INR
 * @param {string} userId - User ID
 * @param {string} packageId - Credit package ID
 * @returns {Object} Razorpay order
 */
async function createRazorpayOrder(amount, userId, packageId) {
    const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `order_${userId}_${Date.now()}`,
        notes: {
            userId,
            packageId,
        },
    };

    try {
        const order = await razorpay.orders.create(options);
        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        };
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        throw new Error('Failed to create payment order');
    }
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether signature is valid
 */
function verifyRazorpayPayment(orderId, paymentId, signature) {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    return expectedSignature === signature;
}

/**
 * Get Razorpay order details
 * @param {string} orderId - Razorpay order ID
 */
async function getRazorpayOrder(orderId) {
    try {
        return await razorpay.orders.fetch(orderId);
    } catch (error) {
        console.error('Error fetching Razorpay order:', error);
        throw error;
    }
}

/**
 * Create a Stripe Checkout Session
 * @param {number} amount - Amount in smallest currency unit
 * @param {string} currency - Currency code (e.g., 'usd', 'inr')
 * @param {string} userId - User ID
 * @param {string} packageId - Credit package ID
 * @param {number} credits - Number of credits
 * @param {string} successUrl - Redirect URL on success
 * @param {string} cancelUrl - Redirect URL on cancel
 */
async function createStripeSession(amount, currency, userId, packageId, credits, successUrl, cancelUrl) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: `${credits} Credits - ATS Resume Checker`,
                            description: `${credits} resume analysis credits`,
                        },
                        unit_amount: amount, // Already in smallest unit
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                packageId,
                credits: credits.toString(),
            },
        });

        return {
            success: true,
            sessionId: session.id,
            url: session.url,
        };
    } catch (error) {
        console.error('Stripe session creation error:', error);
        throw new Error('Failed to create payment session');
    }
}

/**
 * Verify Stripe webhook signature
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Verified event
 */
function verifyStripeWebhook(payload, signature) {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Stripe webhook verification error:', error);
        throw new Error('Webhook signature verification failed');
    }
}

/**
 * Handle Stripe checkout.session.completed event
 * @param {Object} session - Stripe session object
 */
function extractStripeSessionData(session) {
    return {
        userId: session.metadata.userId,
        packageId: session.metadata.packageId,
        credits: parseInt(session.metadata.credits, 10),
        paymentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
    };
}

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getRazorpayOrder,
    createStripeSession,
    verifyStripeWebhook,
    extractStripeSessionData,
};
