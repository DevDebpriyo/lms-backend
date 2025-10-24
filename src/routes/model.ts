import express from 'express';
import modelController from '../controllers/modelController';

const router = express.Router();

// POST /api/model/rephrase
router.post('/rephrase', modelController.rephrase);
router.post('/rephrase-options', modelController.rephraseOptions);
// POST /api/model/ai-score
router.post('/ai-score', modelController.aiScore);
// POST /api/model/plagiarism-check
router.post('/plagiarism-check', modelController.plagiarismCheck);

export default router;
