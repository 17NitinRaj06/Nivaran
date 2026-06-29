import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { getPredictions } from '../../controllers/predictiveController.js';

const router = Router();

router.get('/predictions', verifyToken, requireRole('admin'), getPredictions);

export default router;
