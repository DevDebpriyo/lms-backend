import express from 'express';
import modelController from '../controllers/modelController';
import authenticate from '../middleware/auth';
import quota from '../middleware/quota';

const router = express.Router();

// POST /api/model/rephrase
router.post('/rephrase', authenticate, quota({ subject: 'user' }), modelController.rephrase);
router.post('/rephrase-options', authenticate, quota({ subject: 'user' }), modelController.rephraseOptions);
// POST /api/model/ai-score
router.post('/ai-score', authenticate, quota({ subject: 'user' }), modelController.aiScore);
// POST /api/model/plagiarism-check
router.post('/plagiarism-check', authenticate, quota({ subject: 'user' }), modelController.plagiarismCheck);
// POST /api/model/tone-rewrite
router.post('/tone-rewrite', authenticate, quota({ subject: 'user' }), modelController.toneRewrite);

export default router;
