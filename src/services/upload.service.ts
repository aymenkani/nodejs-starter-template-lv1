import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config } from '../config/config';
import ApiError from '../utils/ApiError';

export const createUploadService = (config: Config) => {
  const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });

  const generateSignedUrl = async (
    fileName: string,
    fileType: string,
    fileSize: number,
  ): Promise<string> => {
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedFileTypes.includes(fileType)) {
      throw new ApiError(
        400,
        'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.',
      );
    }

    if (fileSize > maxFileSize) {
      throw new ApiError(400, 'File size must be less than 5MB.');
    }

    const command = new PutObjectCommand({
      Bucket: config.aws.s3.bucket,
      Key: fileName,
      ContentType: fileType,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
  };

  return {
    generateSignedUrl,
  };
};
