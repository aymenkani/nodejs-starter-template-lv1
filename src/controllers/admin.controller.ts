import { Request, Response, NextFunction } from 'express';
import { adminService, notificationService, userService } from '../services';
import httpStatus from 'http-status';
import { getConfig } from '../config/config';
import ApiError from '../utils/ApiError';
const config = getConfig(process.env);

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (config.demoMode) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Demo mode is enabled. You cannot update users in demo mode.',
      );
    }
    const updatedUser = await adminService.updateUserAsAdmin(req.params.userId, req.body);
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (config.demoMode) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Demo mode is enabled. You cannot delete users in demo mode.',
      );
    }
    await adminService.deleteUser(req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const sendNotificationToAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const users = await adminService.getAllUsers();
    const userIds = users.map((user) => user.id).filter((userId) => req.user?.id !== userId);

    await notificationService.createNotificationsForUserIds(userIds, message, 'new_notification');

    res.status(httpStatus.OK).json({ success: true, message: 'Notification sent to all users.' });
  } catch (error) {
    next(error);
  }
};

export const adminController = {
  getAllUsers,
  updateUser,
  deleteUser,
  sendNotificationToAll,
};
