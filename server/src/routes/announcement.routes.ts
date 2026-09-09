import { Router } from 'express';
import { getActiveAnnouncements, getAllAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// User-facing active announcements
router.get('/', getActiveAnnouncements);

// Admin-facing
router.get('/all', authorizeRoles('admin', 'super_admin'), getAllAnnouncements);
router.post('/', authorizeRoles('admin', 'super_admin'), createAnnouncement);
router.delete('/:id', authorizeRoles('admin', 'super_admin'), deleteAnnouncement);

export default router;
