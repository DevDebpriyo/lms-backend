"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ApiKeySchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Default key' },
    keyId: { type: String, required: true, unique: true, index: true },
    keyHash: { type: String, required: true },
    env: { type: String, enum: ['test', 'live'], default: 'test', index: true },
    scopes: { type: [String], default: ['inference:run'] },
    plan: { type: String, default: 'free' },
    rateLimit: {
        windowMs: { type: Number, default: 60000 },
        max: { type: Number, default: 60 },
    },
    quota: {
        monthly: { type: Number, default: 50000 }, // characters per month for free plan
        usedThisMonth: { type: Number, default: 0 }, // legacy field (not used with Usage collection)
        periodStart: { type: Date, default: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, // legacy
    },
    lastUsedAt: { type: Date },
    revoked: {
        isRevoked: { type: Boolean, default: false, index: true },
        reason: { type: String },
        revokedAt: { type: Date },
    },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('ApiKey', ApiKeySchema);
