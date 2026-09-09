import { Router } from 'express';
import { generateQuiz, getQuizzes, getQuizById } from '../controllers/quiz.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/generate', aiLimiter, generateQuiz);
router.get('/', getQuizzes);
router.get('/:id', getQuizById);

export default router;
