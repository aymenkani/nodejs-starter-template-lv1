import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status'; // Added import
import { authService, tokenService, userService } from '../services';
import { User } from '@prisma/client';
import ApiError from '../utils/ApiError'; // Added import

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    const { password: _password, passwordHistory: _passwordHistory, ...userWithoutPassword } = user;
    res.status(201).send({ user: userWithoutPassword, access: tokens.access });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    const { password: _password, passwordHistory: _passwordHistory, ...userWithoutPassword } = user;
    res.send({ user: userWithoutPassword, access: tokens.access });
  } catch (error) {
    next(error);
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    const accessToken = req.headers.authorization?.split(' ')[1] || ''; // Extract access token from Authorization header
    await authService.logout(refreshToken, accessToken);
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).send({ message: 'Authentication failed' });
    }
    const authenticatedUser = req.user as User;
    const user = await userService.getUserById(authenticatedUser.id);
    if (!user) {
      return res.status(401).send({ message: 'Authentication failed' });
    }
    const tokens = await tokenService.generateAuthTokens(user);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    const { password: _password, passwordHistory: _passwordHistory, ...userWithoutPassword } = user;
    res.send({ user: userWithoutPassword, access: tokens.access });
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.generatePasswordResetToken(email);
    res.status(200).send({ message: 'Password reset email sent successfully.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const checkResetTokenValidity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query; // Assuming token comes as a query parameter
    if (typeof token !== 'string') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Token is required and must be a string');
    }
    await authService.verifyResetToken(token);
    res.status(200).send({ message: 'Password reset token is valid.', success: true });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  register,
  login,
  logout,
  googleCallback,
  requestPasswordReset,
  resetPassword,
  checkResetTokenValidity,
};
