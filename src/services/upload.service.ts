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
export const createUploadService = (config: Config) => {
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

  return {
    generateSignedUrl,
  };
};
