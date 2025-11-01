"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // Not required for Google OAuth users
    googleId: { type: String, unique: true, sparse: true }, // Google OAuth user ID
    emailVerified: { type: Boolean, default: false }, // Email verification status
    avatar: { type: String },
    refreshToken: { type: String },
    billing: {
        country: { type: String },
        state: { type: String },
        city: { type: String },
        street: { type: String },
        zipcode: { type: String },
    },
    subscription: {
        isActive: { type: Boolean, default: false },
        plan: { type: String, enum: ['monthly', 'yearly', null], default: null },
        interval: { type: String, enum: ['month', 'year', null], default: null },
        productId: { type: String, default: null },
        subscriptionId: { type: String, default: null },
        status: { type: String, default: null },
        currency: { type: String, default: null },
        nextBillingDate: { type: Date, default: null },
        previousBillingDate: { type: Date, default: null },
        createdAt: { type: Date, default: null },
        cancelAtPeriodEnd: { type: Boolean, default: null },
        lastPaymentId: { type: String, default: null },
        paymentMethod: { type: String, default: null },
        cardLast4: { type: String, default: null },
        cardNetwork: { type: String, default: null },
        cardType: { type: String, default: null },
        dodoCustomerId: { type: String, default: null },
        updatedAt: { type: Date, default: null },
    },
}, { timestamps: true });
// Hash password before saving (only if password exists and is modified)
UserSchema.pre('save', async function (next) {
    const user = this;
    if (!user.password || !user.isModified('password'))
        return next();
    const salt = await bcrypt_1.default.genSalt(10);
    user.password = await bcrypt_1.default.hash(user.password, salt);
    next();
});
UserSchema.methods.comparePassword = function (candidate) {
    const user = this;
    if (!user.password)
        return Promise.resolve(false);
    return bcrypt_1.default.compare(candidate, user.password);
};
exports.default = (0, mongoose_1.model)('User', UserSchema);
