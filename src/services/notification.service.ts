import { prisma } from '../config/db';
import { Notification } from '../generated/prisma';
import { socketService } from './socket.service';

/**
 * Creates notifications for a list of user IDs.
 * If a user is online, it emits a socket event. Otherwise, it persists the notification in the database.
 * @param {string[]} userIds - The IDs of the users to notify.
 * @param {string} message - The notification message.
 * @param {string} [event='new_notification'] - The socket event to emit.
 */
const createNotificationsForUserIds = async (
  userIds: string[],
  message: string,
  event: string = 'new_notification',
): Promise<void> => {
  const notificationsToPersist: { userId: string; message: string }[] = [];

  for (const userId of userIds) {
    console.log('userId: ', userId);
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

/**
 * Gets all notifications for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Notification[]>} A promise that resolves to an array of notifications.
 */
const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId },
  });
};

/**
 * Deletes a list of notifications by their IDs.
 * @param {string[]} notificationIds - The IDs of the notifications to delete.
 */
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
