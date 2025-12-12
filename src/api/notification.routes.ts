import express from 'express';
import { notificationController } from '../controllers/notification.controller';
import { auth } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { notificationValidation } from '../validations/notification.validation';

const router = express.Router();

router.use(auth); // Protect all routes

router.get('/', notificationController.getNotifications);

router.put(
  '/:id/read',
  validate(notificationValidation.notificationId),
  notificationController.markAsRead,
);

router.delete(
  '/:id',
  validate(notificationValidation.notificationId),
  notificationController.deleteNotification,
);

export default router;
