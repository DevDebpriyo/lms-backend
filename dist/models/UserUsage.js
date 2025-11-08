"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserUsageSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    charactersUsed: { type: Number, default: 0 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    plan: { type: String, default: 'free' },
    characterLimit: { type: Number, default: 50000 },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('UserUsage', UserUsageSchema);
