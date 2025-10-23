// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

// Helper to coerce env strings to the type expected by jsonwebtoken for expiresIn
const asExpires = (value: string | undefined, fallback: string): SignOptions['expiresIn'] =>
  (value ?? fallback) as SignOptions['expiresIn'];
import User from '../models/User';
import { mapProductToPlan } from '../utils/dodo';

const createAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET as Secret;
  const options: SignOptions = {
    expiresIn: asExpires(process.env.ACCESS_TOKEN_EXPIRES, '15m'),
  };
  return jwt.sign({ userId }, secret, options);
};

const createRefreshToken = (userId: string): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET as Secret;
  const options: SignOptions = {
    expiresIn: asExpires(process.env.REFRESH_TOKEN_EXPIRES, '7d'),
  };
  return jwt.sign({ userId }, secret, options);
};

const isProd = process.env.NODE_ENV === 'production';
const refreshCookieOptions: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none' | 'strict';
  path: string;
  maxAge: number;
} = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password });

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    // Store refresh token in httpOnly cookie (cross-site compatible)
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

  const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as Secret) as JwtPayload & { userId: string };
  const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== token) return res.status(401).json({ message: 'Invalid token' });

    const accessToken = createAccessToken(user.id);
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as Secret) as JwtPayload & { userId: string };
      await User.findByIdAndUpdate(payload.userId, { $unset: { refreshToken: 1 } });
    }
    // Use matching options to reliably clear the cookie in browsers
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Normalize response to the frontend contract
    const u: any = user.toObject();

    // Determine interval/name robustly: prefer stored interval, then plan, then product mapping
    const intervalFromDoc: any = u?.subscription?.interval || (u?.subscription?.plan === 'yearly' ? 'year' : u?.subscription?.plan === 'monthly' ? 'month' : undefined);
    const intervalFromProduct: any = !intervalFromDoc && u?.subscription?.productId ? (mapProductToPlan(u.subscription.productId) === 'yearly' ? 'year' : mapProductToPlan(u.subscription.productId) === 'monthly' ? 'month' : undefined) : undefined;
    const planInterval = intervalFromDoc || intervalFromProduct;

    const planName = planInterval === 'year' ? 'Yearly' : planInterval === 'month' ? 'Monthly' : undefined;

    const monthlyPrice = Number(process.env.PLAN_PRICE_MONTHLY || 29);
    const yearlyPrice = Number(process.env.PLAN_PRICE_YEARLY || 289);
    const planPrice = planInterval === 'year' ? yearlyPrice : planInterval === 'month' ? monthlyPrice : undefined;

    // Map Dodo-like status to UI expectations
    // active | trialing | past_due | canceled | inactive
  const rawStatus: string | undefined = u?.subscription?.status || (u?.subscription?.isActive ? 'active' : 'inactive');
    let status = 'inactive';
    if (rawStatus) {
      const s = rawStatus.toLowerCase();
      if (s.includes('active')) status = 'active';
      else if (s.includes('trial')) status = 'trialing';
      else if (s.includes('past_due') || s.includes('past')) status = 'past_due';
      else if (s.includes('cancel')) status = 'canceled';
      else status = u?.subscription?.isActive ? 'active' : 'inactive';
    }

    const subscriptionDoc = u.subscription || {};

    const normalized = {
      id: String(u._id),
      name: u.name,
      email: u.email,
      avatar: u.avatar ?? null,
      createdAt: (u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt)).toISOString(),
      emailVerified: Boolean(u.emailVerified ?? false),
      subscription: {
        // normalized high-level status
        status,
        // plan best-effort: include nulls when unknown so frontend can handle gracefully
        plan: {
          name: planName ?? null,
          interval: planInterval ?? null,
          price: planPrice ?? null,
        },
        // raw identifiers and billing/payment metadata
        productId: subscriptionDoc.productId ?? null,
        subscriptionId: subscriptionDoc.subscriptionId ?? null,
        lastPaymentId: subscriptionDoc.lastPaymentId ?? null,
        paymentMethod: subscriptionDoc.paymentMethod ?? null,
        cardLast4: subscriptionDoc.cardLast4 ?? null,
        currency: subscriptionDoc.currency ?? null,
        // dates
        subscriptionCreatedAt: subscriptionDoc.createdAt ? (subscriptionDoc.createdAt instanceof Date ? subscriptionDoc.createdAt : new Date(subscriptionDoc.createdAt)).toISOString() : null,
        previousPeriodEnd: subscriptionDoc.previousBillingDate ? (subscriptionDoc.previousBillingDate instanceof Date ? subscriptionDoc.previousBillingDate : new Date(subscriptionDoc.previousBillingDate)).toISOString() : null,
        currentPeriodEnd: subscriptionDoc.nextBillingDate ? (subscriptionDoc.nextBillingDate instanceof Date ? subscriptionDoc.nextBillingDate : new Date(subscriptionDoc.nextBillingDate)).toISOString() : null,
        cancelAtPeriodEnd: typeof subscriptionDoc.cancelAtPeriodEnd === 'boolean' ? subscriptionDoc.cancelAtPeriodEnd : false,
      },
    };

    res.json({ user: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
