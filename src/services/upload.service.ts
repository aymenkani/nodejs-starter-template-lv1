import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '../config/config';
import ApiError from '../utils/ApiError';

/**
 * Creates an upload service with methods for generating signed URLs for file uploads.
 * @param config - The application configuration.
 * @returns An object with the `generateSignedUrl` method.
 */
import { prisma } from '../config/db';
import { User, Role } from '@prisma/client';

interface IngestionService {
  addIngestionJob: (data: { fileId: string }) => Promise<void>;
}

/**
 * Creates an upload service with methods for generating signed URLs for file uploads.
 * @param config - The application configuration.
 * @param ingestionService - The ingestion service to trigger processing.
 * @returns An object with the `generateSignedUrl` and `confirmUpload` methods.
 */
export const createUploadService = (config: Config, ingestionService: IngestionService) => {
  const s3Client = new S3Client({
    region: config.aws.region,
    endpoint: process.env.AWS_ENDPOINT, // Using Cloudflare. Remove this if you want to use AWS directly (NOT free tier compatible)
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });

  /**
   * Generates a signed URL for uploading a file to S3.
   * @param fileName - The name of the file to be uploaded.
   * @param fileType - The MIME type of the file.
   * @param fileSize - The size of the file in bytes.
   * @returns A promise that resolves to the signed URL.
   * @throws {ApiError} If the file type or size is invalid.
   */
  const generateSignedUrl = async (
    fileName: string,
    fileType: string,
    fileSize: number,
    userId?: string,
  ): Promise<{ signedUrl: string; fileKey: string }> => {
    const allowedFileTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedFileTypes.includes(fileType)) {
      throw new ApiError(
        400,
        'Invalid file type. Only JPEG, PNG, GIF, WEBP, PDF, and TEXT files are allowed.',
      );
    }

    if (fileSize > maxFileSize) {
      throw new ApiError(400, 'File size must be less than 5MB.');
    }

    if (!userId) {
      throw new ApiError(400, 'User ID is required for file upload.');
    }

    // Sanitize filename: remove special chars, keep alphanumeric, dots, hyphens, underscores
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileKey = `uploads/${userId}/${uuidv4()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: config.aws.s3.bucket,
      Key: fileKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
    return { signedUrl, fileKey };
  };

  /**
   * Confirms the upload of a file, saves it to the database, and triggers ingestion.
   * @param data - The file data (key, mimeType, originalName, isPublic).
   * @param user - The user who uploaded the file.
   * @returns The created file record.
   */
  const confirmUpload = async (
    data: { fileKey: string; mimeType: string; originalName: string; isPublic?: boolean },
    user: User,
  ) => {
    const { fileKey, mimeType, originalName, isPublic } = data;

    // Access Control for Public Files
    let finalIsPublic = false;
    if (isPublic) {
      if (user.role === Role.ADMIN || user.role === Role.CONTRIBUTOR) {
        finalIsPublic = true;
      } else {
        finalIsPublic = false;
      }
    }

    // 1. Create File record
    const file = await prisma.file.create({
      data: {
        fileKey,
        mimeType,
        originalName,
        userId: user.id,
        status: 'PENDING',
        isPublic: finalIsPublic,
      },
    });

    // 2. Add job to queue
    await ingestionService.addIngestionJob({
      fileId: file.id,
    });

    return { message: 'Ingestion started', fileKey, fileId: file.id };
  };

  return {
    generateSignedUrl,
    confirmUpload,
  };
};
