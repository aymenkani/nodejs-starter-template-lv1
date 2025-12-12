import express from 'express';
import authRoutes from './auth.routes';
import tokenRoutes from './token.routes';
import userRoutes from './user.routes';
import { adminRoutes } from './admin.routes';
import uploadRoutes from './upload.routes';
import agentRoutes from './agent.routes';

import fileRoutes from './file.routes';
import notificationRoutes from './notification.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/token', tokenRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/agent', agentRoutes);
router.use('/files', fileRoutes);
router.use('/notifications', notificationRoutes);

export default router;
