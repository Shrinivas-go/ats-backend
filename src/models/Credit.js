const mongoose = require('mongoose');

/**
 * Credit Transaction Model
 * Tracks all credit purchases, usage, and adjustments
 */
const creditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        // Positive for additions, negative for deductions
    },
    type: {
        type: String,
        enum: ['purchase', 'usage', 'bonus', 'refund', 'signup'],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    // Payment reference (for purchases)
    paymentId: {
        type: String,
        sparse: true,
    },
    // What the credit was used for
    relatedScan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScanHistory',
    },
    // Balance after this transaction
    balanceAfter: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
creditSchema.index({ userId: 1, createdAt: -1 });
creditSchema.index({ type: 1, createdAt: -1 });

const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit;
