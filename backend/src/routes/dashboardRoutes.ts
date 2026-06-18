import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Dashboard stats aggregation is restricted to Admin role
router.get('/stats', authenticate, authorize(['ADMIN']), getDashboardStats);

export default router;
