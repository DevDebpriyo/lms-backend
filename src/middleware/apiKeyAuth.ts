import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import ApiKey from '../models/ApiKey';
import { parseApiKey } from '../utils/apiKey';

export interface ApiKeyAuthOptions {
  requireScope?: string;
}

export default function apiKeyAuth(options: ApiKeyAuthOptions = {}) {
  const { requireScope } = options;

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const header = req.get('x-api-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const parsed = parseApiKey(header);
      if (!parsed) return res.status(401).json({ error: 'invalid_api_key' });

      const { keyId, env, secret } = parsed;
      const record = await ApiKey.findOne({ keyId, env, 'revoked.isRevoked': false }).lean();
      if (!record) return res.status(401).json({ error: 'invalid_api_key' });

      const ok = await bcrypt.compare(secret, record.keyHash);
      if (!ok) return res.status(401).json({ error: 'invalid_api_key' });

      if (requireScope && !(record.scopes || []).includes(requireScope)) {
        return res.status(403).json({ error: 'insufficient_scope' });
      }

      (req as any).apiKey = {
        id: record._id.toString(),
        keyId: record.keyId,
        user: record.user,
        env: record.env,
        scopes: record.scopes,
        plan: record.plan,
        rateLimit: record.rateLimit,
        quota: record.quota,
      };

      return next();
    } catch (e) {
      return res.status(500).json({ error: 'api_key_auth_error' });
    }
  };
}
