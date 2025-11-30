import { User as PrismaUser } from '@prisma/client';
import { Socket } from 'socket.io';

declare global {
  namespace Express {
    interface User extends PrismaUser {
      id: string;
    }
  }
}

export type ExtendedSocket = Socket & {
  user?: PrismaUser;
};
