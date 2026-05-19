import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// ─── Public routes ────────────────────────────────────────────

router.post('/register',         AuthController.register);
router.post('/verify-account',   AuthController.verifyAccount);
router.post('/login',            AuthController.login);
router.post('/refresh',  authRateLimiter, AuthController.refresh);
router.post('/logout',   AuthController.logout);

// ─── Protected routes ─────────────────────────────────────────

router.post('/logout-all',       authenticate, AuthController.logoutAll);
router.put('/change-password',   authenticate, AuthController.changePassword);
router.get('/me',                authenticate, AuthController.me);

// Password reset flow
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/reset-password', AuthController.resetPassword);

export default router;
