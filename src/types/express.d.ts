import { User as PrismaUser } from '../generated/prisma';
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
