import { Schema, model, Document, Types } from 'mongoose';

export interface IUsage extends Document {
  user?: Types.ObjectId;
  apiKey?: Types.ObjectId;
  count: number; // characters counted for this request
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const UsageSchema = new Schema<IUsage>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    apiKey: { type: Schema.Types.ObjectId, ref: 'ApiKey', index: true },
    count: { type: Number, required: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

UsageSchema.index({ user: 1, periodStart: 1 });
UsageSchema.index({ apiKey: 1, periodStart: 1 });

export default model<IUsage>('Usage', UsageSchema);
