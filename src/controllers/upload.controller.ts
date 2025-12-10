import { Request, Response, NextFunction } from 'express';
import { uploadService, ingestionService } from '../services';
import { prisma } from '../config/db';
import httpStatus from 'http-status';
import { User } from '@prisma/client';

const generateSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    const { signedUrl, fileKey } = await uploadService.generateSignedUrl(
      fileName,
      fileType,
      fileSize,
      req.user?.id,
    );
    res.send({ signedUrl, fileKey });
  } catch (error) {
    next(error);
  }
};

const confirmUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileKey, mimeType, originalName } = req.body;

    // 1. Create File record
    const file = await prisma.file.create({
      data: {
        fileKey,
        mimeType,
        originalName,
        userId: (req.user as User).id,
        status: 'PENDING',
      },
    });

    // 2. Add job to queue
    await ingestionService.addIngestionJob({
      fileId: file.id,
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
