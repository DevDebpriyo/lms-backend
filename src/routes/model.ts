import express from 'express';
import modelController from '../controllers/modelController';
import authenticate from '../middleware/auth';

const router = express.Router();

// POST /api/model/rephrase
// Note: Frontend now reports usage via POST /api/usage after successful operations
router.post('/rephrase', authenticate, modelController.rephrase);
router.post('/rephrase-options', authenticate, modelController.rephraseOptions);
// POST /api/model/ai-score
router.post('/ai-score', authenticate, modelController.aiScore);
// POST /api/model/plagiarism-check
router.post('/plagiarism-check', authenticate, modelController.plagiarismCheck);
// POST /api/model/tone-rewrite
router.post('/tone-rewrite', authenticate, modelController.toneRewrite);

export default router;
