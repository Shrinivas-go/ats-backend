const mongoose = require('mongoose');

/**
 * Scan History Model
 * Tracks all resume scans for analytics and anonymous user tracking
 */
const scanHistorySchema = new mongoose.Schema({
    // Null for anonymous users
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    // For tracking anonymous users' free scan
    ipAddress: {
        type: String,
        index: true,
    },
    // Resume details
    filename: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number, // in bytes
    },
    // Analysis results
    score: {
        type: Number, // Overall ATS score
    },
    coreSkillsMatch: {
        type: Number, // Percentage
    },
    optionalSkillsMatch: {
        type: Number, // Percentage
    },
    // Job description used (if any)
    jobTitle: {
        type: String,
    },
    // Whether credit was charged
    creditCharged: {
        type: Boolean,
        default: false,
    },
    // Whether this was a free scan
    freeScan: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for finding anonymous user's scans by IP
scanHistorySchema.index({ ipAddress: 1, userId: 1, createdAt: -1 });

// Index for user's scan history
scanHistorySchema.index({ userId: 1, createdAt: -1 });

// Static method to check if IP has used free scan
scanHistorySchema.statics.hasUsedFreeScan = async function (ipAddress) {
    const freeScan = await this.findOne({
        ipAddress,
        userId: null,
        freeScan: true
    });
    return !!freeScan;
};

// Static method to get user's scan count
scanHistorySchema.statics.getUserScanCount = async function (userId) {
    return this.countDocuments({ userId });
};

const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);

module.exports = ScanHistory;
