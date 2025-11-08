"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UsageSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    apiKey: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ApiKey', index: true },
    count: { type: Number, required: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
UsageSchema.index({ user: 1, periodStart: 1 });
UsageSchema.index({ apiKey: 1, periodStart: 1 });
exports.default = (0, mongoose_1.model)('Usage', UsageSchema);
