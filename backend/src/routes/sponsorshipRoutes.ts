import { Router } from 'express';
import { 
  getSponsorships, 
  getSponsorshipById, 
  createSponsorship, 
  updateSponsorshipStatus, 
  deleteSponsorship 
} from '../controllers/sponsorshipController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Viewing sponsorships is open to logged-in users (filtered for Donors in the controller)
router.get('/', authenticate, getSponsorships);
router.get('/:id', authenticate, getSponsorshipById);

// Admin-only operations for creating, updating, and deleting sponsorships
router.post('/', authenticate, authorize(['ADMIN']), createSponsorship);
router.put('/:id/status', authenticate, authorize(['ADMIN']), updateSponsorshipStatus);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteSponsorship);

export default router;
