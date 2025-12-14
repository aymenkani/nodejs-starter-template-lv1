import { prisma } from '../config/db';
import { Notification, NotificationStatus } from '@prisma/client';
import { socketService } from './socket.service';

/**
 * Creates notifications for a list of user IDs.
 * Persists all notifications. If online -> DELIVERED & Emit. If offline -> PENDING.
 * @param {string[]} userIds - The IDs of the users to notify.
 * @param {string} message - The notification message.
 * @param {string} [event='new_notification'] - The socket event to emit.
 */
const createNotificationsForUserIds = async (
  userIds: string[],
  message: string,
  event: string = 'new_notification',
): Promise<void> => {
  // 1. Prepare data
  const notificationsData = await Promise.all(
    userIds.map(async (userId) => {
      const isOnline = await socketService.isUserOnline(userId);
      return {
        userId,
        message,
        status: isOnline ? NotificationStatus.DELIVERED : NotificationStatus.PENDING,
        isOnline, // Helper for next step
      };
    }),
  );

  // 2. Transact: Persist all
  // Note: createMany doesn't return the created records with IDs in all SQL dialects effortlessly in Prisma,
  // but we mostly just need to fire-and-forget the DB write here, OR emit independently.
  // Ideally, valid "persistence" is key.
  await prisma.notification.createMany({
    data: notificationsData.map((n) => ({
      userId: n.userId,
      message: n.message,
      status: n.status,
    })),
  });

  // 3. Emit to online users
  notificationsData.forEach((n) => {
    if (n.isOnline) {
      socketService.emitToUser(n.userId, event, { message: n.message, status: 'DELIVERED' });
    }
  });
};

/**
 * Gets all notifications for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Notification[]>} A promise that resolves to an array of notifications.
 */
const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Updates a notification status to READ.
 * @param {string} notificationId
 * @param {string} userId - Ensure ownership
 */
const markAsRead = async (notificationId: string, userId: string): Promise<Notification> => {
  // Use updateMany to ensure ownership without an extra read, but 'update' returns the record.
  // Standard way:
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found or access denied');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: NotificationStatus.READ },
  });
};

/**
 * Deletes a single notification by ID.
 * @param {string} notificationId
 * @param {string} userId - Ensure ownership
 */
const deleteNotificationById = async (notificationId: string, userId: string): Promise<void> => {
  const count = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });

  if (count.count === 0) {
    // Optional: could throw if not found, or just ignore.
  }
};

/**
 * Updates multiple notifications status (e.g. PENDING -> DELIVERED).
 */
const updateNotificationsStatus = async (
  notificationIds: string[],
  status: NotificationStatus,
): Promise<void> => {
  if (notificationIds.length === 0) return;
  await prisma.notification.updateMany({
    where: { id: { in: notificationIds } },
    data: { status },
  });
};

export const notificationService = {
  createNotificationsForUserIds,
  getNotificationsForUser,
  markAsRead,
  deleteNotificationById,
  updateNotificationsStatus,
};
