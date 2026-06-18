import { Router } from 'express';
import { 
  getCows, 
  getCowById, 
  createCow, 
  updateCow, 
  deleteCow 
} from '../controllers/cowController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadCowPhoto } from '../middleware/upload';

const router = Router();

// Any logged-in user can view cows
router.get('/', authenticate, getCows);
router.get('/:id', authenticate, getCowById);

// Admin-only write access with file upload support
router.post('/', authenticate, authorize(['ADMIN']), uploadCowPhoto.single('photo'), createCow);
router.put('/:id', authenticate, authorize(['ADMIN']), uploadCowPhoto.single('photo'), updateCow);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteCow);

export default router;
