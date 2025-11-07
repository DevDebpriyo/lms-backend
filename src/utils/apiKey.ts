import crypto from 'crypto';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12);

export interface ParsedApiKey {
  prefix: string;
  env: 'test' | 'live';
  keyId: string;
  secret: string;
}

export function generateApiKey(opts?: { env?: 'test' | 'live'; prefix?: string; bytes?: number }) {
  const env = opts?.env ?? ((process.env.API_KEY_DEFAULT_ENV as 'test' | 'live') || 'test');
  const prefix = opts?.prefix ?? (process.env.API_KEY_PREFIX || 'sk');
  const bytes = opts?.bytes ?? Number(process.env.API_KEY_BYTES || 32);

  const keyId = nano();
  const secret = crypto.randomBytes(bytes).toString('base64url');
  const apiKey = `${prefix}_${env}_${keyId}.${secret}`;
  return { apiKey, keyId, secret, env };
}

export function parseApiKey(raw?: string | null): ParsedApiKey | null {
  if (!raw) return null;
  const m = /^([a-zA-Z]{2})_(test|live)_([^.]+)\.(.+)$/.exec(raw.trim());
  if (!m) return null;
  const [, prefix, env, keyId, secret] = m as unknown as [string, string, 'test' | 'live', string, string];
  return { prefix, env, keyId, secret };
}
