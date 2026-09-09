import { Router } from 'express';
import { getMyTickets, createTicket, getAllTickets, updateTicket } from '../controllers/support.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Student endpoints
router.get('/tickets', getMyTickets);
router.post('/tickets', createTicket);

// Admin / Support endpoints
router.get('/admin/tickets', authorizeRoles('admin', 'super_admin', 'support'), getAllTickets);
router.patch('/admin/tickets/:id', authorizeRoles('admin', 'super_admin', 'support'), updateTicket);

export default router;
