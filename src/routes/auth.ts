import { Router } from 'express';
import { register, login, refreshAccessToken, logout, me } from '../controllers/authController';
import authenticate from '../middleware/auth';

const router = Router();

router.post('/register', register); // sign up
router.post('/login', login);  // sign in
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout); // sign out
router.get('/me', authenticate, me); // profiles tab

export default router;
