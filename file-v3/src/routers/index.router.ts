import { Router } from 'express';
import fileRouter from './file.router';
import { appConfig } from '../configs/app.config';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: appConfig.appName,
    timestamp: new Date().toISOString(),
  });
});

// File routes
router.use('/files', fileRouter);

export default router;
