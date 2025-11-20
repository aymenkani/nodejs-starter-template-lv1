import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../config/db';
import { User } from '../generated/prisma';
import ApiError from '../utils/ApiError';
import { socketService } from './socket.service';
import { z } from 'zod';
import { authValidation } from '../validations/auth.validation';

type CreateUserBody = z.infer<typeof authValidation.register.body>;

const createUser = async (userData: CreateUserBody): Promise<User> => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      passwordHistory: [hashedPassword], // Add initial password to history
    },
  });
};

const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

const getUserByUsername = async (username: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { username } });
};

const updateUserEmail = async (
  userId: string,
  newEmail: string,
  currentPassword: string,
): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new Error('User not found or does not have a password set.');
  }

  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    throw new Error('Incorrect password');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });
};

const updateUserUsername = async (userId: string, username: string): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  // Emit an event to the user's room
  socketService.emitToUser(userId, 'user_updated', {
    message: 'Your username has been updated.',
    user: updatedUser,
  });

  return updatedUser;
};

export const userService = {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  updateUserEmail,
  updateUserUsername,
};
