import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this

extendZodWithOpenApi(z); // 2. Call this IMMEDIATELLY

const generateSignedUrlBodySchema = registry.register(
  'GenerateSignedUrlBody',
  z.object({
    fileName: z.string(),
    fileType: z
      .string()
      .refine(
        (val) =>
          [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
          ].includes(val),
        {
          message: 'Invalid file type. Only JPEG, PNG, GIF, WEBP, PDF, and TEXT files are allowed.',
        },
      ),
    fileSize: z.number().max(5 * 1024 * 1024, {
      message: 'File size must be less than 5MB.',
    }),
  }),
);

export const signedUrlResponseSchema = registry.register(
  'SignedUrlResponse',
  z.object({
    signedUrl: z.url(),
  }),
);

const confirmUploadBodySchema = registry.register(
  'ConfirmUploadBody',
  z.object({
    fileKey: z.string().min(1),
    mimeType: z.string().min(1),
  }),
);

export const confirmUploadResponseSchema = registry.register(
  'ConfirmUploadResponse',
  z.object({
    message: z.string(),
    fileKey: z.string(),
  }),
);

export const generateSignedUrl = {
  body: generateSignedUrlBodySchema,
};

export const confirmUpload = {
  body: confirmUploadBodySchema,
};
