import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth users
  googleId?: string; // Google OAuth user ID
  emailVerified?: boolean; // Email verification status
  avatar?: string;
  refreshToken?: string;
  billing?: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    zipcode?: string;
  };
  subscription?: {
    isActive: boolean;
    plan?: 'monthly' | 'yearly' | null;
    interval?: 'month' | 'year' | null;
    productId?: string | null;
    subscriptionId?: string | null;
    status?: string | null;
    currency?: string | null;
    nextBillingDate?: Date | null;
    previousBillingDate?: Date | null;
    createdAt?: Date | null;
    cancelAtPeriodEnd?: boolean | null;
    lastPaymentId?: string | null;
    paymentMethod?: string | null;
    cardLast4?: string | null;
    cardNetwork?: string | null;
    cardType?: string | null;
    dodoCustomerId?: string | null;
    updatedAt?: Date | null;
  };
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // Not required for Google OAuth users
    googleId: { type: String, unique: true, sparse: true }, // Google OAuth user ID
    emailVerified: { type: Boolean, default: false }, // Email verification status
    avatar: { type: String },
    refreshToken: { type: String },
    billing: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
      street: { type: String },
      zipcode: { type: String },
    },
    subscription: {
      isActive: { type: Boolean, default: false },
      plan: { type: String, enum: ['monthly', 'yearly', null], default: null },
      interval: { type: String, enum: ['month', 'year', null], default: null },
      productId: { type: String, default: null },
      subscriptionId: { type: String, default: null },
      status: { type: String, default: null },
      currency: { type: String, default: null },
      nextBillingDate: { type: Date, default: null },
      previousBillingDate: { type: Date, default: null },
      createdAt: { type: Date, default: null },
      cancelAtPeriodEnd: { type: Boolean, default: null },
      lastPaymentId: { type: String, default: null },
      paymentMethod: { type: String, default: null },
      cardLast4: { type: String, default: null },
      cardNetwork: { type: String, default: null },
      cardType: { type: String, default: null },
      dodoCustomerId: { type: String, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Hash password before saving (only if password exists and is modified)
UserSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.password || !user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  const user = this as IUser;
  if (!user.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, user.password);
};

export default model<IUser>('User', UserSchema);
