import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../config/db';
import { User } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { socketService } from './socket.service';
import { z } from 'zod';
import { authValidation } from '../validations/auth.validation';

type CreateUserBody = z.infer<typeof authValidation.register.body>;

/**
 * Creates a new user in the database.
 * Hashes the user's password and initializes their password history.
 * @param userData - The user data, including email, username, and password.
 * @returns A promise that resolves to the newly created user object.
 */
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

/**
 * Retrieves a user by their unique ID.
 * @param id - The ID of the user to retrieve.
 * @returns A promise that resolves to the user object or null if not found.
 */
const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

/**
 * Retrieves a user by their unique email address.
 * @param email - The email address of the user to retrieve.
 * @returns A promise that resolves to the user object or null if not found.
 */
const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

/**
 * Retrieves a user by their unique username.
 * @param username - The username of the user to retrieve.
 * @returns A promise that resolves to the user object or null if not found.
 */
const getUserByUsername = async (username: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { username } });
};

/**
 * Updates a user's email address after verifying their current password.
 * @param userId - The ID of the user to update.
 * @param newEmail - The new email address.
 * @param currentPassword - The user's current password for verification.
 * @returns A promise that resolves to the updated user object or null if the update fails.
 * @throws {ApiError} If the user is not found or the current password is incorrect.
 */
const updateUserEmail = async (
  userId: string,
  newEmail: string,
  currentPassword: string,
): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found or does not have a password set.');
  }

  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect password');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });
};

/**
 * Updates a user's username.
 * As a side effect, it emits a WebSocket event to notify the user of the change.
 * @param userId - The ID of the user to update.
 * @param username - The new username.
 * @returns A promise that resolves to the updated user object.
 */
const updateUserUsername = async (userId: string, username: string): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  // Emit an event to the user's room to notify them of the change
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
