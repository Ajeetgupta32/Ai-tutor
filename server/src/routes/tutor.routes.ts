import { Router } from 'express';
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  sendMessage,
} from '../controllers/tutor.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', aiLimiter, sendMessage);

export default router;
