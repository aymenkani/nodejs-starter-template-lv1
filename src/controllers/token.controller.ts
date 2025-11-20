import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services';
import ApiError from '../utils/ApiError';

const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, 'No refresh token provided');
    const tokens = await tokenService.refreshAuthTokens(refreshToken);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    res.send({ access: tokens.access });
  } catch (error) {
    next(error);
  }
};

export const tokenController = {
  refreshTokens,
};
