import { Router } from 'express';
import { analyzeImage, generateDescription } from '../controllers/aiController.js';
import { uploadImageOnly } from '../middleware/upload.js';
import { verifyToken } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/analyze', verifyToken, aiLimiter, uploadImageOnly.single('image'), analyzeImage);
router.post('/describe', verifyToken, aiLimiter, generateDescription);

export default router;
