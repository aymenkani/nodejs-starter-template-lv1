import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../config/db';
import { User } from '../generated/prisma';
import ApiError from '../utils/ApiError';

const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany();
};

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
