import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import { ExtendedSocket } from '../types/express';
import { socketAuthMiddleware } from '../middleware/socket.middleware';
import { getConfig } from '../config/config';
import { notificationService } from './notification.service';
import { NotificationStatus } from '@prisma/client';
const config = getConfig(process.env);

class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance of the SocketService.
   * @returns {SocketService} The singleton instance.
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initializes the Socket.IO server.
   * @param {HttpServer} server - The HTTP server instance.
   */
  public init(server: HttpServer): void {
    if (this.io) {
      logger.warn('Socket.IO already initialized.');
      return;
    }

    this.io = new Server(server, {
      cors: {
        origin: config.socket.cors.origin,
        methods: ['GET', 'POST'],
      },
    });

    // Middleware for authentication
    this.io.use(socketAuthMiddleware);

    this.io.on('connection', async (socket: Socket) => {
      const extendedSocket = socket as ExtendedSocket;
      logger.info(`New client connected: ${extendedSocket.id}`);

      if (extendedSocket.user) {
        const userId = extendedSocket.user.id.toString();
        logger.info(
          `Authenticated user ${extendedSocket.user.email} connected with socket ${extendedSocket.id}`,
        );

        // Join a room based on the user's ID
        extendedSocket.join(userId);
        logger.info(`Socket ${extendedSocket.id} joined room 'user:${userId}'`);

        // Fetch and send pending notifications
        const pendingNotifications = await notificationService.getNotificationsForUser(userId);

        // Filter only PENDING ones if needed, but getNotificationsForUser gets all.
        // We probably only want to "deliver" the pending ones in the logic sense,
        // but showing HISTORY is also good.
        // For strictly "Pending delivery" logic:
        const undelivered = pendingNotifications.filter((n) => n.status === 'PENDING');

        if (undelivered.length > 0) {
          logger.info(`Sending ${undelivered.length} pending notifications to user ${userId}`);
          extendedSocket.emit('pending_notifications', undelivered);

          // Update status to DELIVERED
          const notificationIds = undelivered.map((n) => n.id);
          await notificationService.updateNotificationsStatus(
            notificationIds,
            NotificationStatus.DELIVERED,
          );
          logger.info(
            `Marked ${notificationIds.length} notifications as DELIVERED for user ${userId}`,
          );
        }
      }

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Example of a custom event listener
      socket.on('ping', (callback: (response: string) => void) => {
        logger.info(`Received ping from ${socket.id}`);
        if (typeof callback === 'function') {
          callback('pong');
        }
      });
    });

    logger.info('Socket.IO service initialized.');
  }

  /**
   * Gets the Socket.IO server instance.
   * @returns {Server} The Socket.IO server instance.
   * @throws {Error} If the Socket.IO server is not initialized.
   */
  public getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.IO not initialized. Call init() first.');
    }
    return this.io;
  }

  /**
   * Emits a socket event to a specific user.
   * @param {string} userId - The ID of the user to emit the event to.
   * @param {string} event - The event name.
   * @param {unknown} data - The data to send with the event.
   * @returns {boolean} True if the event was emitted, false otherwise.
   */
  public emitToUser(userId: string, event: string, data: unknown): boolean {
    if (!this.io) {
      logger.error('Socket.IO not initialized. Cannot emit event.');
      return false;
    }
    const room = userId.toString();
    logger.info(`Emitting event "${event}" to room 'user:${room}'`);
    return this.io.to(room).emit(event, data);
  }

  /**
   * Emits a socket event to all connected clients.
   * @param {string} event - The event name.
   * @param {unknown} data - The data to send with the event.
   * @returns {boolean} True if the event was emitted, false otherwise.
   */
  public emitToAll(event: string, data: unknown): boolean {
    if (!this.io) {
      logger.error('Socket.IO not initialized. Cannot emit event.');
      return false;
    }
    logger.info(`Emitting event "${event}" to all clients.`);
    return this.io.emit(event, data);
  }

  /**
   * Checks if a user is currently online (has an active socket connection).
   * @param {string} userId - The ID of the user to check.
   * @returns {Promise<boolean>} A promise that resolves to true if the user is online, false otherwise.
   */
  public async isUserOnline(userId: string): Promise<boolean> {
    if (!this.io) {
      logger.error('Socket.IO not initialized. Cannot check online status.');
      return false;
    }
    const room = userId.toString();
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.length > 0;
  }
}

export const socketService = SocketService.getInstance();
