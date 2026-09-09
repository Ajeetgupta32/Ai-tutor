import { Router } from 'express';
import {
  getStudentDashboard,
  getProgressAnalytics,
  getLearningDNA,
  getSkillGapAnalysis,
  getAdaptiveRoadmap,
} from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getStudentDashboard);
router.get('/analytics', getProgressAnalytics);
router.get('/dna', getLearningDNA);
router.get('/skill-gap', getSkillGapAnalysis);
router.get('/roadmap', getAdaptiveRoadmap);

export default router;
