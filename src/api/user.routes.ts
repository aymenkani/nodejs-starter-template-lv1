import express from 'express';
import { userController } from '../controllers';
import { auth, authorize } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { userValidation } from '../validations/user.validation';
import { Role } from '@prisma/client';

const router = express.Router();

// All routes in this file are protected
router.use(auth, authorize([Role.USER]));

router.get('/profile', userController.getProfile);

router.put('/profile/email', validate(userValidation.updateEmail), userController.updateEmail);

export default router;
