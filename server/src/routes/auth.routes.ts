import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  sendOtp,
  verifyOtp,
  registerWithOtp,
  verifyAccountOtp,
  resetPasswordOtp,
  resetPasswordDirect,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register-with-otp', registerWithOtp);
router.post('/verify-account-otp', verifyAccountOtp);
router.post('/reset-password-otp', resetPasswordOtp);
router.post('/reset-password', resetPasswordDirect);
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
