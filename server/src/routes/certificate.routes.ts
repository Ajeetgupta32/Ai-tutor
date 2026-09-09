import { Router } from 'express';
import { getMyCertificates, getCertificateById, verifyCertificate } from '../controllers/certificate.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public verification
router.get('/verify/:code', verifyCertificate);

// Authenticated routes
router.use(authenticate);
router.get('/', getMyCertificates);
router.get('/:id', getCertificateById);

export default router;
