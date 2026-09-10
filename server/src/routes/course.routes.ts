import { Router } from 'express';
import {
  getPublishedCourses,
  getCourseById,
  enrollCourse,
  completeLesson,
} from '../controllers/course.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Courses are accessible by students & teachers (authenticated)
router.use(authenticate);

router.get('/', getPublishedCourses);
router.get('/:id', getCourseById);
router.post('/:id/enroll', enrollCourse);
router.post('/:id/lessons/:lessonId/complete', completeLesson);

export default router;
