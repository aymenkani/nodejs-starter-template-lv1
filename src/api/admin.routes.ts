import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { auth, authorize } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { adminValidation } from '../validations/admin.validation';
import { notificationValidation } from '../validations/notification.validation';
import { Role } from '@prisma/client';

const router = Router();

router.use(auth, authorize([Role.ADMIN]));

router.get('/users', adminController.getAllUsers);
router.put('/users/:userId', validate(adminValidation.updateUser), adminController.updateUser);
router.delete('/users/:userId', validate(adminValidation.deleteUser), adminController.deleteUser);
router.post(
  '/notifications',
  validate(notificationValidation.sendNotification),
  adminController.sendNotificationToAll,
);

export const adminRoutes = router;
