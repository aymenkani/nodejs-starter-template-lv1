import express from 'express';
import { agentController } from '../controllers';
import { auth, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// All routes in this file are protected
router.use(auth, authorize([Role.USER, Role.ADMIN]));

router.post(
  '/chat',
  // Add validation if needed
  agentController.chat,
);

export default router;
