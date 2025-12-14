import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services';

const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id; // Auth middleware guarantees user
    const notification = await notificationService.markAsRead(id, userId);
    res.status(httpStatus.OK).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    await notificationService.deleteNotificationById(id, userId);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getNotificationsForUser(userId);
    res.status(httpStatus.OK).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const notificationController = {
  getNotifications,
  markAsRead,
  deleteNotification,
};
