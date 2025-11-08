import { Request, Response, NextFunction } from 'express';
import Usage from '../models/Usage';
import ApiKey from '../models/ApiKey';
import User from '../models/User';
import { currentMonthWindow, FREE_PLAN_LIMIT, countCharsFromBody, remainingAfter } from '../utils/quota';

type Subject = 'user' | 'apiKey';

interface QuotaOptions {
  subject: Subject; // who to charge
}

export default function quota(options: QuotaOptions) {
  const { subject } = options;

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // Determine subject identifier and plan
      let plan = 'free';
      let limit = FREE_PLAN_LIMIT;
      let userId: string | null = null;
      let apiKeyId: string | null = null;

      if (subject === 'user') {
        userId = (req as any).userId as string | undefined || null;
        if (!userId) return res.status(401).json({ error: 'expired_session' });
        // If user has an active subscription, consider unlimited (or a much higher cap)
        const user = await User.findById(userId).lean();
        if (user?.subscription?.isActive) {
          plan = user.subscription.plan || 'pro';
          limit = Number(process.env.PRO_PLAN_CHAR_LIMIT || Infinity);
        }
      } else if (subject === 'apiKey') {
        const apiKey = (req as any).apiKey as any;
        apiKeyId = apiKey?.id ?? null;
        if (!apiKeyId) return res.status(401).json({ error: 'invalid_api_key' });
        // Get api key record to learn plan/overrides
        const key = await ApiKey.findById(apiKeyId).lean();
        if (!key) return res.status(401).json({ error: 'invalid_api_key' });
        plan = key.plan || 'free';
        // If not free, lift limit; otherwise use default or key.quota.monthly if set
        if (plan !== 'free') {
          limit = Number(process.env.PRO_PLAN_CHAR_LIMIT || Infinity);
        } else if (key.quota?.monthly) {
          limit = key.quota.monthly;
        }
      }

      const { start, end } = currentMonthWindow(new Date());

      // Count characters from request payload (input only)
      const count = countCharsFromBody(req.body);
      // Fetch used so far this period
      const match: any = { createdAt: { $gte: start, $lt: end } };
      if (userId) match.user = userId;
      if (apiKeyId) match.apiKey = apiKeyId;

      const agg = await Usage.aggregate([
        { $match: match },
        { $group: { _id: null, used: { $sum: '$count' } } },
      ]);
      const used = agg[0]?.used || 0;

      // Prepare headers for public endpoints (and optionally for user endpoints too)
      const resetsAtISO = end.toISOString();
      res.setHeader('X-Quota-Limit', String(Number.isFinite(limit) ? limit : 0));
      const remaining = Number.isFinite(limit) ? remainingAfter(limit as number, used, count) : 0;
      res.setHeader('X-Quota-Remaining', String(remaining));
      res.setHeader('X-Quota-Reset', resetsAtISO);

      // Enforce when limit is finite
      if (Number.isFinite(limit) && used + count > (limit as number)) {
        return res.status(402).json({ error: 'insufficient_quota' });
      }

      // Record usage after response is sent, regardless of success or error
      res.on('finish', async () => {
        try {
          await Usage.create({
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
        } catch (e) {
          // swallow errors, don't crash response lifecycle
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to record usage', e);
          }
        }
      });

      // Attach quota info for downstream if needed
      (req as any).quota = { plan, limit, used, remainingBefore: Number.isFinite(limit) ? (limit as number) - used : Infinity, period: { start, end } };

      return next();
    } catch (e) {
      return res.status(500).json({ error: 'quota_enforcement_failed' });
    }
  };
}
