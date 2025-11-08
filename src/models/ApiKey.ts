import { Schema, model, Document, Types } from 'mongoose';

export type ApiKeyEnv = 'test' | 'live';

export interface IApiKey extends Document {
  user: Types.ObjectId;
  name: string;
  keyId: string; // public identifier
  keyHash: string; // bcrypt hash of secret part
  env: ApiKeyEnv;
  scopes: string[];
  plan?: string;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  quota?: {
    monthly: number; // allowed requests per month
    usedThisMonth: number;
    periodStart: Date; // start of monthly period
  };
  lastUsedAt?: Date;
  revoked?: {
    isRevoked: boolean;
    reason?: string;
    revokedAt?: Date;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Default key' },

    keyId: { type: String, required: true, unique: true, index: true },
    keyHash: { type: String, required: true },

    env: { type: String, enum: ['test', 'live'], default: 'test', index: true },
    scopes: { type: [String], default: ['inference:run'] },

    plan: { type: String, default: 'free' },
    rateLimit: {
      windowMs: { type: Number, default: 60_000 },
      max: { type: Number, default: 60 },
    },
    quota: {
      monthly: { type: Number, default: 50_000 }, // characters per month for free plan
      usedThisMonth: { type: Number, default: 0 }, // legacy field (not used with Usage collection)
      periodStart: { type: Date, default: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, // legacy
    },

    lastUsedAt: { type: Date },
    revoked: {
      isRevoked: { type: Boolean, default: false, index: true },
      reason: { type: String },
      revokedAt: { type: Date },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default model<IApiKey>('ApiKey', ApiKeySchema);
