"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Helper to coerce env strings to the type expected by jsonwebtoken for expiresIn
const asExpires = (value, fallback) => (value ?? fallback);
const User_1 = __importDefault(require("../models/User"));
const createAccessToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    const options = {
        expiresIn: asExpires(process.env.ACCESS_TOKEN_EXPIRES, '15m'),
    };
    return jsonwebtoken_1.default.sign({ userId }, secret, options);
};
const createRefreshToken = (userId) => {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
        expiresIn: asExpires(process.env.REFRESH_TOKEN_EXPIRES, '7d'),
    };
    return jsonwebtoken_1.default.sign({ userId }, secret, options);
};
const isProd = process.env.NODE_ENV === 'production';
const refreshCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Missing fields' });
        const existing = await User_1.default.findOne({ email });
        if (existing)
            return res.status(400).json({ message: 'Email already in use' });
        const user = await User_1.default.create({ name, email, password });
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Missing fields' });
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid credentials' });
        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);
        res.json({
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
            accessToken,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const refreshAccessToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token)
            return res.status(401).json({ message: 'No refresh token' });
        const payload = jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User_1.default.findById(payload.userId);
        if (!user || user.refreshToken !== token)
            return res.status(401).json({ message: 'Invalid token' });
        const accessToken = createAccessToken(user.id);
        res.json({ accessToken });
    }
    catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.refreshAccessToken = refreshAccessToken;
const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            const payload = jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
            await User_1.default.findByIdAndUpdate(payload.userId, { $unset: { refreshToken: 1 } });
        }
        // Use matching options to reliably clear the cookie in browsers
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });
        res.json({ message: 'Logged out' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.logout = logout;
const me = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User_1.default.findById(userId).select('-password -refreshToken');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Normalize response to the frontend contract
        const u = user.toObject();
        const planName = u?.subscription?.plan === 'yearly'
            ? 'Yearly'
            : u?.subscription?.plan === 'monthly'
                ? 'Monthly'
                : undefined;
        const planInterval = u?.subscription?.plan === 'yearly'
            ? 'year'
            : u?.subscription?.plan === 'monthly'
                ? 'month'
                : undefined;
        const monthlyPrice = Number(process.env.PLAN_PRICE_MONTHLY || 29);
        const yearlyPrice = Number(process.env.PLAN_PRICE_YEARLY || 289);
        const planPrice = planInterval === 'year' ? yearlyPrice : planInterval === 'month' ? monthlyPrice : undefined;
        // Map Dodo-like status to UI expectations
        // active | trialing | past_due | canceled | inactive
        const rawStatus = u?.subscription?.status || (u?.subscription?.isActive ? 'active' : 'inactive');
        let status = 'inactive';
        if (rawStatus) {
            const s = rawStatus.toLowerCase();
            if (s.includes('active'))
                status = 'active';
            else if (s.includes('trial'))
                status = 'trialing';
            else if (s.includes('past_due') || s.includes('past'))
                status = 'past_due';
            else if (s.includes('cancel'))
                status = 'canceled';
            else
                status = u?.subscription?.isActive ? 'active' : 'inactive';
        }
        const normalized = {
            id: String(u._id),
            name: u.name,
            email: u.email,
            avatar: u.avatar ?? null,
            createdAt: (u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt)).toISOString(),
            emailVerified: Boolean(u.emailVerified ?? false),
            subscription: u.subscription
                ? {
                    status,
                    plan: planName && planInterval && planPrice != null
                        ? { name: planName, interval: planInterval, price: planPrice }
                        : undefined,
                    currentPeriodEnd: u.subscription.nextBillingDate ? new Date(u.subscription.nextBillingDate).toISOString() : null,
                    cancelAtPeriodEnd: typeof u.subscription.cancelAtPeriodEnd === 'boolean' ? u.subscription.cancelAtPeriodEnd : false,
                }
                : undefined,
        };
        res.json({ user: normalized });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.me = me;
