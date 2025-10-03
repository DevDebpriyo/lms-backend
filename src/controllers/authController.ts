// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

// Helper to coerce env strings to the type expected by jsonwebtoken for expiresIn
const asExpires = (value: string | undefined, fallback: string): SignOptions['expiresIn'] =>
  (value ?? fallback) as SignOptions['expiresIn'];
import User from '../models/User';

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

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    // Store refresh token in httpOnly cookie (recommended)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
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

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
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
    res.clearCookie('refreshToken');
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
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
