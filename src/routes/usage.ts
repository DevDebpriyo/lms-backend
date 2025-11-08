import { Router } from 'express';
import authenticate from '../middleware/auth';
import Usage from '../models/Usage';
import User from '../models/User';
import { currentMonthWindow, FREE_PLAN_LIMIT } from '../utils/quota';

const router = Router();

// GET /api/usage - session/JWT required
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const user = await User.findById(userId).lean();
  const plan = user?.subscription?.isActive ? user?.subscription?.plan || 'pro' : 'free';
  // Frontend expects a bar scaled to the free limit; keep limit constant at 50k for display
  const limit = FREE_PLAN_LIMIT;

    const { start, end } = currentMonthWindow(new Date());
    const agg = await Usage.aggregate([
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
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_fetch_usage' });
  }
});

export default router;
