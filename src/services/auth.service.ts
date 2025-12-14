import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import ApiError from '../utils/ApiError';
import { userService } from './user.service';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createEmailService } from './email.service';
import { Config } from '../config/config';
import logger from '../utils/logger';

import { z } from 'zod';
import { authValidation } from '../validations/auth.validation';

export const createAuthService = (config: Config) => {
  const emailService = createEmailService(config);

  type RegisterUserBody = z.infer<typeof authValidation.register.body>;

  /**
   * Registers a new user.
   * @param {RegisterUserBody} userData - The user data for registration.
   * @returns {Promise<User>} The created user.
   * @throws {ApiError} If the email or username is already taken.
   */
  const registerUser = async (userData: RegisterUserBody): Promise<User> => {
    if (await userService.getUserByEmail(userData.email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    if (await userService.getUserByUsername(userData.username)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    }
    const user = await userService.createUser(userData);
    return user;
  };

  /**
   * Logs in a user with their email and password.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<User>} The logged-in user.
   * @throws {ApiError} If the email or password is incorrect.
   */
  const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
    const user = await userService.getUserByEmail(email);

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    // Update password history on successful login
    const passwordHistoryLimit = 5;
    const updatedPasswordHistory = [user.password, ...user.passwordHistory].slice(
      0,
      passwordHistoryLimit,
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHistory: updatedPasswordHistory,
      },
    });

    return user;
  };

  /**
   * Logs out a user by deleting their refresh token and blacklisting their access token.
   * @param {string} refreshToken - The user's refresh token.
   * @param {string} [accessToken] - The user's access token.
   * @throws {ApiError} If the refresh token is not provided or not found.
   */
  const logout = async (refreshToken: string, accessToken?: string): Promise<void> => {
    if (!refreshToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No refresh token provided');
    }

    const refreshTokenDoc = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
      },
    });
    if (!refreshTokenDoc) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }
    await prisma.refreshToken.delete({ where: { id: refreshTokenDoc.id } });

    if (accessToken) {
      try {
        const decodedToken = jwt.decode(accessToken) as { exp: number };
        if (decodedToken && decodedToken.exp) {
          await prisma.blacklistedToken.create({
            data: {
              token: accessToken,
              expires: new Date(decodedToken.exp * 1000), // exp is in seconds, convert to milliseconds
            },
          });
        }
      } catch (error) {
        // Log the error but don't prevent logout if access token is malformed
        logger.error(`Error blacklisting access token: ${error} `);
      }
    }
  };

  /**
   * Generates a password reset token and sends it to the user's email.
   * @param {string} email - The user's email.
   * @throws {ApiError} If the user is not found.
   */
  const generatePasswordResetToken = async (email: string): Promise<void> => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const jwtResetToken = jwt.sign({ sub: user.id }, config.jwt.resetPasswordSecret, {
      expiresIn: `${config.jwt.resetPasswordExpirationMinutes}m`,
    });

    const hashedJwtResetToken = await bcrypt.hash(jwtResetToken, 10); // Hash the JWT
    const opaqueResetToken = uuidv4(); // Generate an opaque token (UUID)

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + config.jwt.resetPasswordExpirationMinutes);

    await prisma.passwordResetToken.create({
      data: {
        token: hashedJwtResetToken, // Store the hashed JWT
        opaqueToken: opaqueResetToken, // Store the opaque token
        userId: user.id,
        expires: expires,
      },
    });

    await emailService.sendResetPasswordEmail(user.email, opaqueResetToken, config.client.url); // Send opaque token in email
  };

  /**
   * Resets a user's password.
   * @param {string} opaqueResetToken - The opaque password reset token.
   * @param {string} newPassword - The new password.
   * @throws {ApiError} If the token is invalid, expired, or the new password has been used recently.
   */
  const resetPassword = async (opaqueResetToken: string, newPassword: string): Promise<void> => {
    try {
      const passwordResetTokenDoc = await prisma.passwordResetToken.findUnique({
        where: { opaqueToken: opaqueResetToken },
      });

      if (!passwordResetTokenDoc || passwordResetTokenDoc.expires < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
      }

      const user = await userService.getUserById(passwordResetTokenDoc.userId);

      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User not found for this reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Check against password history
      const passwordHistoryLimit = 5; // Define how many past passwords to keep
      for (const oldHashedPassword of user.passwordHistory) {
        if (await bcrypt.compare(newPassword, oldHashedPassword)) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'New password cannot be one of the recently used passwords',
          );
        }
      }

      // Update password and history
      const updatedPasswordHistory = [hashedPassword, ...user.passwordHistory].slice(
        0,
        passwordHistoryLimit,
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordHistory: updatedPasswordHistory,
        },
      });

      // Invalidate all refresh tokens for the user to force logout from all devices
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Invalidate the reset token after use
      await prisma.passwordResetToken.delete({
        where: { id: passwordResetTokenDoc.id },
      });
    } catch (error) {
      // Re-throw as ApiError if it's not already one, or if it's a specific error we want to mask
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
    }
  };

  /**
   * Verifies a password reset token.
   * @param {string} opaqueResetToken - The opaque password reset token.
   * @throws {ApiError} If the token is invalid or expired.
   */
  const verifyResetToken = async (opaqueResetToken: string): Promise<void> => {
    const passwordResetTokenDoc = await prisma.passwordResetToken.findUnique({
      where: { opaqueToken: opaqueResetToken },
    });

    if (!passwordResetTokenDoc || passwordResetTokenDoc.expires < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
    }
  };

  return {
    registerUser,
    loginUserWithEmailAndPassword,
    logout,
    generatePasswordResetToken,
    resetPassword,
    verifyResetToken, // Export the new function
  };
};
