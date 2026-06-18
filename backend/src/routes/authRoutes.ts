import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  refresh, 
  forgotPassword, 
  resetPassword, 
  getProfile,
  getUsers
} from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', register);
router.post('/login', authRateLimiter, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/profile', authenticate, getProfile);
router.get('/users', authenticate, authorize(['ADMIN']), getUsers);

export default router;
