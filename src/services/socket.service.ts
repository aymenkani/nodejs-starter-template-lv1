import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import { ExtendedSocket } from '../types/express';
import { socketAuthMiddleware } from '../middleware/socket.middleware';
import { getConfig } from '../config/config';
import { notificationService } from './notification.service';
const config = getConfig(process.env);

class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

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
        if (pendingNotifications.length > 0) {
          logger.info(
            `Sending ${pendingNotifications.length} pending notifications to user ${userId}`,
          );
          extendedSocket.emit('pending_notifications', pendingNotifications);

          // Delete notifications after sending
          const notificationIds = pendingNotifications.map((n) => n.id);
          await notificationService.deleteNotifications(notificationIds);
          logger.info(`Deleted ${notificationIds.length} notifications for user ${userId}`);
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

  public getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.IO not initialized. Call init() first.');
    }
    return this.io;
  }

  public emitToUser(userId: string, event: string, data: unknown): boolean {
    if (!this.io) {
      logger.error('Socket.IO not initialized. Cannot emit event.');
      return false;
    }
    const room = userId.toString();
    logger.info(`Emitting event "${event}" to room 'user:${room}'`);
    return this.io.to(room).emit(event, data);
  }

  public emitToAll(event: string, data: unknown): boolean {
    if (!this.io) {
      logger.error('Socket.IO not initialized. Cannot emit event.');
      return false;
    }
    logger.info(`Emitting event "${event}" to all clients.`);
    return this.io.emit(event, data);
  }

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
