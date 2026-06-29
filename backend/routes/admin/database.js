import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  getCollections,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../../controllers/adminController.js';

const router = Router();

router.use(verifyToken, requireRole('admin'));

router.get('/collections', getCollections);
router.get('/:collection', listDocuments);
router.get('/:collection/:id', getDocument);
router.post('/:collection', createDocument);
router.put('/:collection/:id', updateDocument);
router.delete('/:collection/:id', deleteDocument);

export default router;
