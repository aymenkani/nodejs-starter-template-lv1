import express from 'express';
import authRoutes from './auth.routes';
import tokenRoutes from './token.routes';
import userRoutes from './user.routes';
import { adminRoutes } from './admin.routes';
import uploadRoutes from './upload.routes';
import agentRoutes from './agent.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/token', tokenRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/agent', agentRoutes);

export default router;
