import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const authenticatedUser = req.user;
    const user = await userService.getUserById(authenticatedUser.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const {
      password: _userPassword,
      passwordHistory: _passwordHistory,
      ...userWithoutPassword
    } = user;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

const updateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { email, password } = req.body;
    const authenticatedUser = req.user;
    const updatedUser = await userService.updateUserEmail(authenticatedUser.id, email, password);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or password incorrect' });
    }
    const {
      password: _userPassword,
      passwordHistory: _passwordHistory,
      ...userWithoutPassword
    } = updatedUser;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

export const userController = {
  getProfile,
  updateEmail,
};
