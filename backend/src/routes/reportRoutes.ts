import { Router } from 'express';
import { 
  getDonationReport, 
  exportDonationReportCSV, 
  exportDonationReportPDF,
  getDonorReport
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only Admin and Staff roles can request reports and exports
router.get('/donations', authenticate, authorize(['ADMIN', 'STAFF']), getDonationReport);
router.get('/donations/csv', authenticate, authorize(['ADMIN', 'STAFF']), exportDonationReportCSV);
router.get('/donations/pdf', authenticate, authorize(['ADMIN', 'STAFF']), exportDonationReportPDF);
router.get('/donors', authenticate, authorize(['ADMIN', 'STAFF']), getDonorReport);

export default router;
