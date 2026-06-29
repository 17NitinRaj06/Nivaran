import { Router } from 'express';
import {
  autoAssignReport,
  checkEscalations,
  getResolutionSuggestions,
  suggestAssignment,
  batchAutoAssign,
} from '../controllers/agenticController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/auto-assign/:id', verifyToken, requireRole('officer', 'admin'), autoAssignReport);
router.get('/escalations', verifyToken, requireRole('admin'), checkEscalations);
router.get('/suggestions/:id', verifyToken, requireRole('officer', 'admin'), aiLimiter, getResolutionSuggestions);
router.get('/suggest-assignment/:id', verifyToken, requireRole('officer', 'admin'), aiLimiter, suggestAssignment);
router.post('/batch-assign', verifyToken, requireRole('admin'), batchAutoAssign);

export default router;
