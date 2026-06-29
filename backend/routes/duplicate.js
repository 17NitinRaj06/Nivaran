import { Router } from 'express';
import { detectDuplicate } from '../controllers/reportController.js';
import { verifyToken } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/detect', verifyToken, aiLimiter, detectDuplicate);

export default router;
