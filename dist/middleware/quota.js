"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = quota;
const Usage_1 = __importDefault(require("../models/Usage"));
const ApiKey_1 = __importDefault(require("../models/ApiKey"));
const User_1 = __importDefault(require("../models/User"));
const quota_1 = require("../utils/quota");
function quota(options) {
    const { subject } = options;
    return async function (req, res, next) {
        try {
            // Determine subject identifier and plan
            let plan = 'free';
            let limit = quota_1.FREE_PLAN_LIMIT;
            let userId = null;
            let apiKeyId = null;
            if (subject === 'user') {
                userId = req.userId || null;
                if (!userId)
                    return res.status(401).json({ error: 'expired_session' });
                // If user has an active subscription, consider unlimited (or a much higher cap)
                const user = await User_1.default.findById(userId).lean();
                if (user?.subscription?.isActive) {
                    plan = user.subscription.plan || 'pro';
                    limit = Number(process.env.PRO_PLAN_CHAR_LIMIT || Infinity);
                }
            }
            else if (subject === 'apiKey') {
                const apiKey = req.apiKey;
                apiKeyId = apiKey?.id ?? null;
                if (!apiKeyId)
                    return res.status(401).json({ error: 'invalid_api_key' });
                // Get api key record to learn plan/overrides
                const key = await ApiKey_1.default.findById(apiKeyId).lean();
                if (!key)
                    return res.status(401).json({ error: 'invalid_api_key' });
                plan = key.plan || 'free';
                // If not free, lift limit; otherwise use default or key.quota.monthly if set
                if (plan !== 'free') {
                    limit = Number(process.env.PRO_PLAN_CHAR_LIMIT || Infinity);
                }
                else if (key.quota?.monthly) {
                    limit = key.quota.monthly;
                }
            }
            const { start, end } = (0, quota_1.currentMonthWindow)(new Date());
            // Count characters from request payload (input only)
            const count = (0, quota_1.countCharsFromBody)(req.body);
            // Fetch used so far this period
            const match = { createdAt: { $gte: start, $lt: end } };
            if (userId)
                match.user = userId;
            if (apiKeyId)
                match.apiKey = apiKeyId;
            const agg = await Usage_1.default.aggregate([
                { $match: match },
                { $group: { _id: null, used: { $sum: '$count' } } },
            ]);
            const used = agg[0]?.used || 0;
            // Prepare headers for public endpoints (and optionally for user endpoints too)
            const resetsAtISO = end.toISOString();
            res.setHeader('X-Quota-Limit', String(Number.isFinite(limit) ? limit : 0));
            const remaining = Number.isFinite(limit) ? (0, quota_1.remainingAfter)(limit, used, count) : 0;
            res.setHeader('X-Quota-Remaining', String(remaining));
            res.setHeader('X-Quota-Reset', resetsAtISO);
            // Enforce when limit is finite
            if (Number.isFinite(limit) && used + count > limit) {
                return res.status(402).json({ error: 'insufficient_quota' });
            }
            // Record usage after response is sent, regardless of success or error
            res.on('finish', async () => {
                try {
                    await Usage_1.default.create({
                        user: userId || undefined,
                        apiKey: apiKeyId || undefined,
                        count,
                        periodStart: start,
                        periodEnd: end,
                        metadata: {
                            path: req.path,
                            method: req.method,
                            statusCode: res.statusCode,
                        },
                    });
                }
                catch (e) {
                    // swallow errors, don't crash response lifecycle
                    if (process.env.NODE_ENV !== 'production') {
                        console.error('Failed to record usage', e);
                    }
                }
            });
            // Attach quota info for downstream if needed
            req.quota = { plan, limit, used, remainingBefore: Number.isFinite(limit) ? limit - used : Infinity, period: { start, end } };
            return next();
        }
        catch (e) {
            return res.status(500).json({ error: 'quota_enforcement_failed' });
        }
    };
}
