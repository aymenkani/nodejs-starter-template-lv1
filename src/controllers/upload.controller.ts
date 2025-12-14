import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services';
import httpStatus from 'http-status';
import { User } from '@prisma/client';

const generateSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, fileSize, isPublic } = req.body;
    const { signedUrl, fileKey, fileId } = await uploadService.generateSignedUrl(
      fileName,
      fileType,
      fileSize,
      isPublic,
      req.user as User,
    );
    res.send({ signedUrl, fileKey, fileId });
  } catch (error) {
    next(error);
  }
};

const confirmUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await uploadService.confirmUpload(req.body, req.user as User);
    res.status(httpStatus.CREATED).send(response);
  } catch (error) {
    next(error);
  }
};

export const uploadController = {
  generateSignedUrl,
  confirmUpload,
};
