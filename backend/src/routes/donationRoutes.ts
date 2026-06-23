import { Router } from 'express';
import { 
  getDonations, 
  getDonationById, 
  createDonation, 
  updateDonation, 
  deleteDonation,
  getDonationReceipt
} from '../controllers/donationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get donations - open to all authenticated roles (restricted inside controller for Donors)
router.get('/', authenticate, getDonations);
router.get('/:id', authenticate, getDonationById);
router.get('/:id/receipt', authenticate, getDonationReceipt);

// Record and modify donations - Admin and Staff only
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), createDonation);
router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), updateDonation);

// Delete donations - Admin only
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteDonation);

export default router;
