import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin/stats.js';
import adminDbRoutes from './routes/admin/database.js';
import adminPredictiveRoutes from './routes/admin/predictive.js';
import duplicateRoutes from './routes/duplicate.js';
import agenticRoutes from './routes/agentic.js';
import { apiLimiter } from './middleware/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/db', adminDbRoutes);
app.use('/api/admin/insights', adminPredictiveRoutes);
app.use('/api/duplicate', duplicateRoutes);
app.use('/api/agentic', agenticRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Nivaran API server running on port ${PORT}`);
});

export default app;
