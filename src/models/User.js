const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: function () {
            // Password required only for local auth (not Google OAuth)
            return this.authProvider === 'local';
        },
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't include password in queries by default
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local',
    },
    googleId: {
        type: String,
        sparse: true, // Allows null/undefined values while maintaining uniqueness if present
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    refreshToken: {
        type: String,
        select: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    avatar: {
        type: String, // For Google profile picture
    },
    // Credit system
    credits: {
        type: Number,
        default: 3, // New users get 3 free credits
        min: 0,
    },
    totalScans: {
        type: Number,
        default: 0,
    },
    // Profile customization
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    selectedAvatar: {
        type: String, // ID of predefined avatar or 'google' for Google profile pic
        default: null,
    },
}, {
    timestamps: true,
});

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function () {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.__v;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
