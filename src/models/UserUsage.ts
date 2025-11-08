import { Schema, model, Document, Types } from 'mongoose';

export interface IUserUsage extends Document {
  user: Types.ObjectId;
  charactersUsed: number; // cumulative for current period
  periodStart: Date;
  periodEnd: Date;
  plan: string; // "free", "pro", "enterprise"
  characterLimit: number; // based on plan
  createdAt: Date;
  updatedAt: Date;
}

const UserUsageSchema = new Schema<IUserUsage>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    charactersUsed: { type: Number, default: 0 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    plan: { type: String, default: 'free' },
    characterLimit: { type: Number, default: 50_000 },
  },
  { timestamps: true }
);

export default model<IUserUsage>('UserUsage', UserUsageSchema);
