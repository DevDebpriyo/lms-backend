"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const authController_1 = require("../controllers/authController");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
// Rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
// Traditional auth routes
router.post('/register', authLimiter, authController_1.register); // sign up
router.post('/login', authLimiter, authController_1.login); // sign in
router.post('/refresh', authController_1.refreshAccessToken);
router.post('/logout', authController_1.logout); // sign out
router.get('/me', auth_1.default, authController_1.me); // profiles tab
// Google OAuth routes
// Option A: Authorization Code Flow
// GET /api/auth/google/start - Redirects to Google OAuth consent screen
router.get('/google/start', authController_1.googleAuthStart);
// GET /api/auth/google/callback - Handles OAuth callback from Google
router.get('/google/callback', authController_1.googleAuthCallback);
// Option B: ID Token Flow (for Google One Tap / @react-oauth/google)
// POST /api/auth/google - Accepts ID token from frontend
router.post('/google', authLimiter, authController_1.googleAuthToken);
exports.default = router;
