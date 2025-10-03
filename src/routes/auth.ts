import { Router } from 'express';
import { register, login, refreshAccessToken, logout, me } from '../controllers/authController';
import authenticate from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
