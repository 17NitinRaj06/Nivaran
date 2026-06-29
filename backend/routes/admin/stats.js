import { Router } from 'express';
import { getAdminStats } from '../../controllers/reportController.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/stats', verifyToken, requireRole('admin'), getAdminStats);

export default router;
