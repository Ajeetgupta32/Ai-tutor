import { Router } from 'express';
import {
  getAdminMetrics,
  getAtRiskStudents,
  triggerStudentIntervention,
  getUsers,
  getDetailedUserProfile,
  updateUserRole,
  deleteUser,
  getQuestionBank,
  createQuestionBankItem,
  updateQuestionStatus,
  getCourses,
  createCourse,
  createCourseModule,
  createCourseLesson,
  getAiAnalytics,
  getAuditLogs,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('admin', 'super_admin'));

// Metrics & Analytics
router.get('/metrics', getAdminMetrics);
router.get('/ai-analytics', getAiAnalytics);
router.get('/audit-logs', getAuditLogs);

// At-Risk Intelligence
router.get('/at-risk', getAtRiskStudents);
router.post('/at-risk/:studentId/intervene', triggerStudentIntervention);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getDetailedUserProfile);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Question Bank
router.get('/question-bank', getQuestionBank);
router.post('/question-bank', createQuestionBankItem);
router.patch('/question-bank/:id/status', updateQuestionStatus);

// Course Management
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.post('/courses/:courseId/modules', createCourseModule);
router.post('/modules/:moduleId/lessons', createCourseLesson);

export default router;
