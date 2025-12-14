import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services';
import { User } from '@prisma/client';

const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = (req.query.filter as string) || 'all';
    const result = await fileService.listFiles(req.user as User, filter);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

export const fileController = {
  listFiles,
};
