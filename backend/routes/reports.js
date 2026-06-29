import { Router } from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  toggleUpvote,
  verifyReport,
  assignReport,
  officerResolveReport,
} from '../controllers/reportController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { reportLimiter, upvoteLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', verifyToken, reportLimiter, createReport);
router.patch('/:id/status', verifyToken, requireRole('officer', 'admin'), updateReportStatus);
router.post('/:id/upvote', verifyToken, upvoteLimiter, toggleUpvote);

router.post('/:id/verify', verifyToken, requireRole('officer', 'admin'), verifyReport);
router.post('/:id/assign', verifyToken, requireRole('officer', 'admin'), assignReport);
router.post('/:id/officer-resolve', verifyToken, requireRole('officer', 'admin'), officerResolveReport);

export default router;
