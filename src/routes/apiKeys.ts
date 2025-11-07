import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import authenticate from '../middleware/auth';
import ApiKey from '../models/ApiKey';
import { generateApiKey } from '../utils/apiKey';

const router = Router();

// Require app auth (JWT) to manage keys
router.use(authenticate);

// Create a new API key
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { name = 'Default key', env, scopes = ['inference:run'] } = (req.body || {}) as {
      name?: string;
      env?: 'test' | 'live';
      scopes?: string[];
    };

    const { apiKey, keyId, secret, env: resolvedEnv } = generateApiKey({ env });
    const keyHash = await bcrypt.hash(secret, 12);

    const doc = await ApiKey.create({
      user: userId,
      name,
      keyId,
      keyHash,
      env: resolvedEnv,
      scopes,
    });

    return res.status(201).json({
      id: doc._id,
      name: doc.name,
      env: doc.env,
      key: apiKey, // only return once!
      scopes: doc.scopes,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_create_key' });
  }
});

// List API keys (masked)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const keys = await ApiKey.find({ user: userId })
      .select('name env keyId scopes createdAt lastUsedAt revoked rateLimit quota')
      .lean();

    // Mask presentation: show only keyId, not the secret
    return res.json({ keys });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_list_keys' });
  }
});

// Revoke an API key
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const { id } = req.params;

    const doc = await ApiKey.findOneAndUpdate(
      { _id: id, user: userId, 'revoked.isRevoked': false },
      { $set: { revoked: { isRevoked: true, revokedAt: new Date(), reason: 'user_revoked' } } },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: 'not_found' });

    return res.json({ revoked: true, id: doc._id });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_revoke_key' });
  }
});

export default router;
