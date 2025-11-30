import { Socket } from 'socket.io';
import passport from 'passport';
import { User } from '@prisma/client';
import { ExtendedSocket } from '../types/express';
import logger from '../utils/logger';
import { IncomingMessage } from 'http';
import ApiError from '../utils/ApiError';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  // The 'request' object in a socket is the underlying HTTP request.
  // We can pass this to passport's authenticate method.
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: User | false, info: any) => {
      if (err) {
        logger.error({ err }, 'Socket authentication error');
        return next(new ApiError(500, 'Socket authentication error'));
      }
      if (!user) {
        // You can choose to deny the connection or allow unauthenticated connections.
        // For this template, we'll allow unauthenticated connections but they won't have a `user` object.
        logger.warn(
          `Socket connection not authenticated for socket ${socket.id}: ${info?.message || 'No user found'}`,
        );
        return next();
      }
      // Attach user to the socket object for future use
      (socket as ExtendedSocket).user = user;
      next();
    },
  )(socket.request as IncomingMessage, {}, next);
};
