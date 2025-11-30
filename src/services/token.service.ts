import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { Config } from '../config/config';
import { prisma } from '../config/db';
import ApiError from '../utils/ApiError';
import { User } from '@prisma/client';

export const createTokenService = (config: Config) => {
  /**
   * Generates a JWT token.
   * @param {string} userId - The ID of the user.
   * @param {Date} expires - The expiration date of the token.
   * @param {string} [secret=config.jwt.secret] - The JWT secret.
   * @returns {string} The generated JWT token.
   */
  const generateToken = (
    userId: string,
    expires: Date,
    secret: string = config.jwt.secret,
  ): string => {
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: expires.getTime() / 1000,
    };
    return jwt.sign(payload, secret);
  };

  /**
   * Verifies a JWT token.
   * @param {string} token - The JWT token to verify.
   * @param {string} [secret=config.jwt.secret] - The JWT secret.
   * @returns {jwt.JwtPayload | string} The decoded token payload.
   */
  const verifyToken = (
    token: string,
    secret: string = config.jwt.secret,
  ): jwt.JwtPayload | string => {
    const payload = jwt.verify(token, secret);
    return payload;
  };

  /**
   * Generates authentication tokens (access and refresh) for a user.
   * @param {User} user - The user to generate tokens for.
   * @returns {Promise<object>} A promise that resolves to the authentication tokens.
   */
  const generateAuthTokens = async (user: User) => {
    const accessTokenExpires = new Date(
      Date.now() + config.jwt.accessExpirationMinutes * 60 * 1000,
    );
    const accessToken = generateToken(user.id, accessTokenExpires);

    const refreshTokenExpires = new Date(
      Date.now() + config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000,
    );
    const refreshToken = generateToken(user.id, refreshTokenExpires);

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expires: refreshTokenExpires,
      },
    });

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires,
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires,
      },
    };
  };

  /**
   * Refreshes authentication tokens using a refresh token.
   * @param {string} refreshToken - The refresh token.
   * @returns {Promise<object>} A promise that resolves to the new authentication tokens.
   * @throws {ApiError} If the refresh token is invalid.
   */
  const refreshAuthTokens = async (refreshToken: string) => {
    try {
      const refreshTokenPayload = verifyToken(refreshToken) as jwt.JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: refreshTokenPayload.sub } });
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
      }

      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return generateAuthTokens(user);
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : undefined;
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token', true, errorStack);
    }
  };

  return {
    generateAuthTokens,
    refreshAuthTokens,
    verifyToken,
    generateToken,
  };
};
