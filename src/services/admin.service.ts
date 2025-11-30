import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../config/db';
import { User } from '@prisma/client';
import ApiError from '../utils/ApiError';

/**
 * Get all users.
 * @returns {Promise<User[]>} A promise that resolves to an array of users.
 */
const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany();
};

/**
 * Update a user by their ID as an admin.
 * @param {string} userId - The ID of the user to update.
 * @param {Partial<User>} updateBody - The user data to update.
 * @returns {Promise<User>} A promise that resolves to the updated user.
 * @throws {ApiError} If the user is not found or if the new password has been used recently.
 */
const updateUserAsAdmin = async (userId: string, updateBody: Partial<User>): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser: Partial<User> = { ...updateBody };

  if (updateBody.password) {
    // Check against password history if it exists
    if (user.passwordHistory) {
      for (const oldHashedPassword of user.passwordHistory) {
        if (await bcrypt.compare(updateBody.password, oldHashedPassword)) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'New password cannot be one of the recently used passwords',
          );
        }
      }
    }

    const hashedPassword = await bcrypt.hash(updateBody.password, 10);
    const passwordHistoryLimit = 5;
    const updatedPasswordHistory = [hashedPassword, ...(user.passwordHistory || [])].slice(
      0,
      passwordHistoryLimit,
    );

    updatedUser.password = hashedPassword;
    updatedUser.passwordHistory = updatedPasswordHistory;
  }

  return prisma.user.update({
    where: { id: userId },
    data: updatedUser,
  });
};

/**
 * Delete a user by their ID.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<User>} A promise that resolves to the deleted user.
 */
const deleteUser = async (userId: string): Promise<User> => {
  return prisma.user.delete({
    where: { id: userId },
  });
};

export const adminService = {
  getAllUsers,
  updateUserAsAdmin,
  deleteUser,
};
