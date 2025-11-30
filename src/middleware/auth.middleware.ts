import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services';
import { userService } from '../services/user.service';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { prisma } from '../config/db'; // Import prisma
import { Role } from '@prisma/client';

// Middleware to protect routes
const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, no token'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, invalid token format'));
  }

  const token = parts[1];

  // Check if the token is blacklisted
  const blacklistedToken = await prisma.blacklistedToken.findUnique({
    where: { token: token },
  });

  if (blacklistedToken) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Token has been invalidated'));
  }

  try {
    const decoded = tokenService.verifyToken(token) as jwt.JwtPayload;

    if (!decoded.sub) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, invalid token'));
    }

    const user = await userService.getUserById(decoded.sub);
    if (!user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
    }
    req.user = user;
    next();
  } catch (error) {
    const errorStack = error instanceof Error ? error.stack : undefined;
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, token failed', true, errorStack),
    );
  }
};

/**
 * Middleware to authorize routes based on user roles.
 * @param {Role[]} requiredRoles - An array of roles that are allowed to access the route.
 * @returns {Function} - Express middleware function.
 */
const authorize = (requiredRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated'));
    }
    const userRole = req.user.role;
    if (!requiredRoles.includes(userRole)) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, 'User is not authorized to access this route'),
      );
    }

    next();
  };
};

export { auth, authorize };
