import { prisma } from '../config/db';
import { Notification } from '../generated/prisma';
import { socketService } from './socket.service';

const createNotificationsForUserIds = async (
  userIds: string[],
  message: string,
  event: string = 'new_notification',
): Promise<void> => {
  const notificationsToPersist: { userId: string; message: string }[] = [];

  for (const userId of userIds) {
    const isOnline = await socketService.isUserOnline(userId);
    if (isOnline) {
      socketService.emitToUser(userId, event, { message });
    } else {
      notificationsToPersist.push({ userId, message });
    }
  }

  if (notificationsToPersist.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToPersist,
    });
  }
};

const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId },
  });
};

const deleteNotifications = async (notificationIds: string[]): Promise<void> => {
  await prisma.notification.deleteMany({
    where: {
      id: {
        in: notificationIds,
      },
    },
  });
};

export const notificationService = {
  createNotificationsForUserIds,
  getNotificationsForUser,
  deleteNotifications,
};
