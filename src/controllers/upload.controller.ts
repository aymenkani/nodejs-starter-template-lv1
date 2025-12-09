import { Request, Response, NextFunction } from 'express';
import { uploadService, ingestionService } from '../services';
import httpStatus from 'http-status';

const generateSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const signedUrl = await uploadService.generateSignedUrl(fileName, fileType, fileSize);
    res.send({ signedUrl });
  } catch (error) {
    next(error);
  }
};

const confirmUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileKey, mimeType } = req.body;
    await ingestionService.addIngestionJob({
      fileKey,
      mimeType,
      userId: (req.user as any).id,
    });
    res.status(httpStatus.CREATED).send({ message: 'Ingestion started', fileKey });
  } catch (error) {
    next(error);
  }
};

export const uploadController = {
  generateSignedUrl,
  confirmUpload,
};
