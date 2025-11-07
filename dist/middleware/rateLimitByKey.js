"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rateLimitByKey;
// Simple in-memory rate limiter per API key. For multi-instance deployments, use Redis.
const buckets = new Map();
function rateLimitByKey() {
    return function (req, res, next) {
        const apiKey = req.apiKey;
        const key = apiKey?.keyId;
        if (!key)
            return res.status(401).json({ error: 'invalid_api_key' });
        const windowMs = apiKey?.rateLimit?.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
        const max = apiKey?.rateLimit?.max ?? Number(process.env.RATE_LIMIT_MAX || 60);
        const now = Date.now();
        const bucket = buckets.get(key) || { windowStart: now, count: 0 };
        if (now - bucket.windowStart >= windowMs) {
            bucket.windowStart = now;
            bucket.count = 0;
        }
        bucket.count += 1;
        buckets.set(key, bucket);
        const remaining = Math.max(0, max - bucket.count);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        res.setHeader('X-RateLimit-Reset', String(bucket.windowStart + windowMs));
        if (bucket.count > max) {
            return res.status(429).json({ error: 'rate_limit_exceeded' });
        }
        next();
    };
}
