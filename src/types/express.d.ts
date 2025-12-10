import { User as PrismaUser } from '@prisma/client';
import { Request } from 'express';
import { Socket } from 'socket.io';

declare global {
  namespace Express {
    interface User extends PrismaUser {
      id: string;
    }
  }
}

export interface AuthRequest extends Request {
  user: PrismaUser;
}

export type ExtendedSocket = Socket & {
  user?: PrismaUser;
};
