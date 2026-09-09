import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tutorRoutes from './tutor.routes.js';
import quizRoutes from './quiz.routes.js';
import attemptRoutes from './attempt.routes.js';
import progressRoutes from './progress.routes.js';
import materialRoutes from './material.routes.js';
import subjectRoutes from './subject.routes.js';
import adminRoutes from './admin.routes.js';
import goalRoutes from './goal.routes.js';
import studyPlanRoutes from './studyPlan.routes.js';
import certificateRoutes from './certificate.routes.js';
import notificationRoutes from './notification.routes.js';
import supportRoutes from './support.routes.js';
import announcementRoutes from './announcement.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tutor', tutorRoutes);
router.use('/quizzes', quizRoutes);
router.use('/quiz-attempts', attemptRoutes);
router.use('/progress', progressRoutes);
router.use('/materials', materialRoutes);
router.use('/subjects', subjectRoutes);
router.use('/admin', adminRoutes);
router.use('/goals', goalRoutes);
router.use('/study-plans', studyPlanRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/announcements', announcementRoutes);

export default router;
