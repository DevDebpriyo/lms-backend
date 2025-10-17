import express from 'express';
import modelController from '../controllers/modelController';

const router = express.Router();

// POST /api/model/rephrase
router.post('/rephrase', modelController.rephrase);

export default router;
