import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter per API key. For multi-instance deployments, use Redis.
const buckets = new Map<string, { windowStart: number; count: number }>();

export default function rateLimitByKey() {
  return function (req: Request, res: Response, next: NextFunction) {
    const apiKey = (req as any).apiKey;
    const key = apiKey?.keyId as string | undefined;
    if (!key) return res.status(401).json({ error: 'invalid_api_key' });

    const windowMs = apiKey?.rateLimit?.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
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
