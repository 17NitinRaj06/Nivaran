import { Router } from 'express';
import { getUser, getLeaderboard } from '../controllers/userController.js';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUser);

export default router;
