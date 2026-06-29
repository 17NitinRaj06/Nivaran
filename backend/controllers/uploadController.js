import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const folder = req.body.folder || 'nivaran/reports';
    const isVideo = req.file.mimetype.startsWith('video/');

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: isVideo ? 'video' : 'image',
      chunk_size: 6000000,
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: isVideo ? 'video' : 'image',
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
