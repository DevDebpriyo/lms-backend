"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthToken = exports.googleAuthCallback = exports.googleAuthStart = exports.me = exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// Helper to coerce env strings to the type expected by jsonwebtoken for expiresIn
const asExpires = (value, fallback) => (value ?? fallback);
const User_1 = __importDefault(require("../models/User"));
const dodo_1 = require("../utils/dodo");
const googleAuth_1 = require("../services/googleAuth");
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
        const user = await User_1.default.create({ name, email, password, emailVerified: false });
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
        // Determine interval/name robustly: prefer stored interval, then plan, then product mapping
        const intervalFromDoc = u?.subscription?.interval || (u?.subscription?.plan === 'yearly' ? 'year' : u?.subscription?.plan === 'monthly' ? 'month' : undefined);
        const intervalFromProduct = !intervalFromDoc && u?.subscription?.productId ? ((0, dodo_1.mapProductToPlan)(u.subscription.productId) === 'yearly' ? 'year' : (0, dodo_1.mapProductToPlan)(u.subscription.productId) === 'monthly' ? 'month' : undefined) : undefined;
        const planInterval = intervalFromDoc || intervalFromProduct;
        const planName = planInterval === 'year' ? 'Yearly' : planInterval === 'month' ? 'Monthly' : undefined;
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.me = me;
// ==================== Google OAuth Endpoints ====================
/**
 * GET /api/auth/google/start
 * Redirects user to Google OAuth consent screen
 */
const googleAuthStart = async (_req, res) => {
    try {
        // Generate anti-CSRF state token
        const state = crypto_1.default.randomBytes(32).toString('hex');
        // Store state in a cookie to verify on callback
        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 10 * 60 * 1000, // 10 minutes
            path: '/',
        });
        const authUrl = (0, googleAuth_1.getGoogleAuthUrl)(state);
        res.redirect(authUrl);
    }
    catch (err) {
        console.error('Google auth start error:', err);
        res.status(500).json({ message: 'Failed to initiate Google authentication' });
    }
};
exports.googleAuthStart = googleAuthStart;
/**
 * GET /api/auth/google/callback?code=...&state=...
 * Exchange authorization code for tokens and create session
 */
const googleAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const storedState = req.cookies.oauth_state;
        // Verify state parameter to prevent CSRF
        if (!state || !storedState || state !== storedState) {
            return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
        }
        // Clear state cookie
        res.clearCookie('oauth_state', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });
        if (!code || typeof code !== 'string') {
            return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
        }
        // Exchange code for tokens and get profile
        const profile = await (0, googleAuth_1.exchangeCodeForTokens)(code);
        // Upsert user
        let user = await User_1.default.findOne({ googleId: profile.sub });
        if (!user) {
            // Check if user exists with same email
            user = await User_1.default.findOne({ email: profile.email });
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.sub;
                user.emailVerified = profile.email_verified || user.emailVerified || false;
                if (profile.picture && !user.avatar)
                    user.avatar = profile.picture;
                await user.save();
            }
            else {
                // Create new user
                user = await User_1.default.create({
                    googleId: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    avatar: profile.picture,
                    emailVerified: profile.email_verified || false,
                });
            }
        }
        else {
            // Update existing Google user
            user.name = profile.name;
            user.avatar = profile.picture || user.avatar;
            user.emailVerified = profile.email_verified || user.emailVerified || false;
            await user.save();
        }
        // Create session
        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);
        // Redirect to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        res.redirect(`${frontendUrl}/features`);
    }
    catch (err) {
        console.error('Google auth callback error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        res.redirect(`${frontendUrl}?error=auth_failed`);
    }
};
exports.googleAuthCallback = googleAuthCallback;
/**
 * POST /api/auth/google
 * Simplified Google One Tap / ID Token flow
 * Body: { credential: string }
 * Response: { ok: true, user, accessToken }
 */
const googleAuthToken = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential || typeof credential !== 'string') {
            return res.status(400).json({ message: 'Missing or invalid credential' });
        }
        // Verify ID token
        const profile = await (0, googleAuth_1.verifyGoogleIdToken)(credential);
        // Upsert user
        let user = await User_1.default.findOne({ googleId: profile.sub });
        if (!user) {
            // Check if user exists with same email
            user = await User_1.default.findOne({ email: profile.email });
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.sub;
                user.emailVerified = profile.email_verified || user.emailVerified || false;
                if (profile.picture && !user.avatar)
                    user.avatar = profile.picture;
                await user.save();
            }
            else {
                // Create new user
                user = await User_1.default.create({
                    googleId: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    avatar: profile.picture,
                    emailVerified: profile.email_verified || false,
                });
            }
        }
        else {
            // Update existing Google user
            user.name = profile.name;
            user.avatar = profile.picture || user.avatar;
            user.emailVerified = profile.email_verified || user.emailVerified || false;
            await user.save();
        }
        // Create session
        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);
        res.json({
            ok: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                emailVerified: user.emailVerified,
            },
            accessToken,
        });
    }
    catch (err) {
        console.error('Google auth token error:', err);
        res.status(400).json({ message: 'Invalid Google credential' });
    }
};
exports.googleAuthToken = googleAuthToken;
