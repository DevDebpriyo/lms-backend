"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const Usage_1 = __importDefault(require("../models/Usage"));
const User_1 = __importDefault(require("../models/User"));
const quota_1 = require("../utils/quota");
const router = (0, express_1.Router)();
// GET /api/usage - session/JWT required
router.get('/', auth_1.default, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User_1.default.findById(userId).lean();
        const plan = user?.subscription?.isActive ? user?.subscription?.plan || 'pro' : 'free';
        // Frontend expects a bar scaled to the free limit; keep limit constant at 50k for display
        const limit = quota_1.FREE_PLAN_LIMIT;
        const { start, end } = (0, quota_1.currentMonthWindow)(new Date());
        const agg = await Usage_1.default.aggregate([
            { $match: { user: userId, createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: null, used: { $sum: '$count' } } },
        ]);
        const used = agg[0]?.used || 0;
        const remaining = Math.max(0, (limit || 0) - used);
        return res.json({
            plan,
            limit,
            used,
            remaining,
            period: { start: start.toISOString(), end: end.toISOString() },
            resetsAt: end.toISOString(),
        });
    }
    catch (e) {
        return res.status(500).json({ error: 'failed_to_fetch_usage' });
    }
});
exports.default = router;
