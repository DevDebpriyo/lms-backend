import express from 'express';
import apiKeyAuth from '../../middleware/apiKeyAuth';
import rateLimitByKey from '../../middleware/rateLimitByKey';
import modelController from '../../controllers/modelController';
import quota from '../../middleware/quota';

const router = express.Router();

// API-key protected versions of model endpoints
router.post('/model/rephrase', apiKeyAuth({ requireScope: 'inference:run' }), rateLimitByKey(), quota({ subject: 'apiKey' }), modelController.rephrase);
router.post('/model/rephrase-options', apiKeyAuth({ requireScope: 'inference:run' }), rateLimitByKey(), quota({ subject: 'apiKey' }), modelController.rephraseOptions);
router.post('/model/ai-score', apiKeyAuth({ requireScope: 'inference:run' }), rateLimitByKey(), quota({ subject: 'apiKey' }), modelController.aiScore);
router.post('/model/plagiarism-check', apiKeyAuth({ requireScope: 'inference:run' }), rateLimitByKey(), quota({ subject: 'apiKey' }), modelController.plagiarismCheck);
router.post('/model/tone-rewrite', apiKeyAuth({ requireScope: 'inference:run' }), rateLimitByKey(), quota({ subject: 'apiKey' }), modelController.toneRewrite);

export default router;
