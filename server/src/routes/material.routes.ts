import { Router } from 'express';
import {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  askMaterialAI,
  generateQuizFromMaterial,
} from '../controllers/material.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadMaterial);
router.get('/', getMaterials);
router.get('/:id', getMaterialById);
router.post('/:id/chat', aiLimiter, askMaterialAI);
router.post('/:id/generate-quiz', aiLimiter, generateQuizFromMaterial);

export default router;
