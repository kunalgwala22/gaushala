import { Router } from 'express';
import { 
  getDonors, 
  getDonorById, 
  createDonor, 
  updateDonor, 
  deleteDonor 
} from '../controllers/donorController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only Admin and Staff can manage donors. Admin only can delete.
router.get('/', authenticate, authorize(['ADMIN', 'STAFF']), getDonors);
router.get('/:id', authenticate, authorize(['ADMIN', 'STAFF']), getDonorById);
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), createDonor);
router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), updateDonor);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteDonor);

export default router;
