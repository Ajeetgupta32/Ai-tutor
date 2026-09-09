import { Router } from 'express';
import { getStudyPlans, createStudyPlan, updateStudyPlan, deleteStudyPlan } from '../controllers/studyPlan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getStudyPlans);
router.post('/generate', createStudyPlan);
router.patch('/:id', updateStudyPlan);
router.delete('/:id', deleteStudyPlan);

export default router;
