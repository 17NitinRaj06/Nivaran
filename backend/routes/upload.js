import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { upload, uploadImageOnly } from '../middleware/upload.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/', verifyToken, upload.single('file'), uploadImage);
router.post('/image', verifyToken, uploadImageOnly.single('image'), uploadImage);

export default router;
