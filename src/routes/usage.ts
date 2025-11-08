import { Router } from 'express';
import authenticate from '../middleware/auth';
import UserUsage from '../models/UserUsage';
import User from '../models/User';
import { currentMonthWindow, FREE_PLAN_LIMIT } from '../utils/quota';

const router = Router();

// Helper to ensure UserUsage record exists and is reset if period has passed
async function getOrCreateUserUsage(userId: string, userPlan: string) {
  const now = new Date();
  const { start, end } = currentMonthWindow(now);
  
  let record = await UserUsage.findOne({ user: userId });
  
  if (!record) {
    // Create new record
    record = await UserUsage.create({
      user: userId,
      charactersUsed: 0,
      periodStart: start,
      periodEnd: end,
      plan: userPlan,
      characterLimit: FREE_PLAN_LIMIT,
    });
  } else {
    // Check if period has passed, reset if needed
    if (now >= record.periodEnd) {
      record.charactersUsed = 0;
      record.periodStart = start;
      record.periodEnd = end;
      record.plan = userPlan;
      await record.save();
    }
  }
  
  return record;
}

// GET /api/usage - session/JWT required
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const user = await User.findById(userId).lean();
    const plan = user?.subscription?.isActive ? user?.subscription?.plan || 'pro' : 'free';
    
    const record = await getOrCreateUserUsage(userId, plan);
    const remaining = Math.max(0, record.characterLimit - record.charactersUsed);

    return res.json({
      plan: record.plan,
      limit: record.characterLimit,
      used: record.charactersUsed,
      remaining,
      period: { 
        start: record.periodStart.toISOString(), 
        end: record.periodEnd.toISOString() 
      },
      resetsAt: record.periodEnd.toISOString(),
    });
  } catch (e) {
    console.error('GET /api/usage error:', e);
    return res.status(500).json({ error: 'failed_to_fetch_usage' });
  }
});

// POST /api/usage - frontend reports character usage
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { charactersUsed } = req.body;

    if (typeof charactersUsed !== 'number' || charactersUsed <= 0) {
      return res.status(400).json({ 
        error: 'invalid_request', 
        message: 'charactersUsed must be a positive number' 
      });
    }

    console.log(`📊 POST /api/usage - User ${userId} reporting ${charactersUsed} characters used`);

    const user = await User.findById(userId).lean();
    const plan = user?.subscription?.isActive ? user?.subscription?.plan || 'pro' : 'free';
    
    const record = await getOrCreateUserUsage(userId, plan);
    
    // Check if adding this usage would exceed limit
    const newTotal = record.charactersUsed + charactersUsed;
    if (plan === 'free' && newTotal > record.characterLimit) {
      return res.status(402).json({
        error: 'insufficient_quota',
        message: 'Free usage limit reached. Please upgrade to continue.',
        used: newTotal,
        limit: record.characterLimit,
      });
    }

    // Update usage
    record.charactersUsed = newTotal;
    await record.save();
    
    console.log(`✅ Usage updated successfully - User ${userId} now at ${record.charactersUsed}/${record.characterLimit} characters`);

    const remaining = Math.max(0, record.characterLimit - record.charactersUsed);

    return res.json({
      plan: record.plan,
      limit: record.characterLimit,
      used: record.charactersUsed,
      remaining,
      period: { 
        start: record.periodStart.toISOString(), 
        end: record.periodEnd.toISOString() 
      },
      resetsAt: record.periodEnd.toISOString(),
    });
  } catch (e) {
    console.error('POST /api/usage error:', e);
    return res.status(500).json({ error: 'failed_to_update_usage' });
  }
});

export default router;
