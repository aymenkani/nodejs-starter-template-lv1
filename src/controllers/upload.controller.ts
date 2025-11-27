import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services';

const generateSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const signedUrl = await uploadService.generateSignedUrl(fileName, fileType, fileSize);
    res.send({ signedUrl });
  } catch (error) {
    next(error);
  }
};

export const uploadController = {
  generateSignedUrl,
};
