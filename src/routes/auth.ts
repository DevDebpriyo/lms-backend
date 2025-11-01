import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { 
  register, 
  login, 
  refreshAccessToken, 
  logout, 
  me,
  googleAuthStart,
  googleAuthCallback,
  googleAuthToken,
} from '../controllers/authController';
import authenticate from '../middleware/auth';

const router = Router();

// Rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Traditional auth routes
router.post('/register', authLimiter, register); // sign up
router.post('/login', authLimiter, login);  // sign in
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout); // sign out
router.get('/me', authenticate, me); // profiles tab

// Google OAuth routes

// Option A: Authorization Code Flow
// GET /api/auth/google/start - Redirects to Google OAuth consent screen
router.get('/google/start', googleAuthStart);

// GET /api/auth/google/callback - Handles OAuth callback from Google
router.get('/google/callback', googleAuthCallback);

// Option B: ID Token Flow (for Google One Tap / @react-oauth/google)
// POST /api/auth/google - Accepts ID token from frontend
router.post('/google', authLimiter, googleAuthToken);

export default router;
