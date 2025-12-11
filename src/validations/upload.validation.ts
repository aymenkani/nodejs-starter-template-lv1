import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this

extendZodWithOpenApi(z); // 2. Call this IMMEDIATELLY

const generateSignedUrlBodySchema = registry.register(
  'GenerateSignedUrlBody',
  z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1),
    fileSize: z.number().positive(),
    isPublic: z.boolean().default(false),
  }),
);

export const signedUrlResponseSchema = registry.register(
  'SignedUrlResponse',
  z.object({
    signedUrl: z.url(),
    fileKey: z.string(),
    fileId: z.uuid(),
  }),
);

const confirmUploadBodySchema = registry.register(
  'ConfirmUploadBody',
  z.object({
    fileId: z.uuid(),
  }),
);

export const confirmUploadResponseSchema = registry.register(
  'ConfirmUploadResponse',
  z.object({
    message: z.string(),
    fileId: z.uuid(),
  }),
);

export const generateSignedUrl = {
  body: generateSignedUrlBodySchema,
};

export const confirmUpload = {
  body: confirmUploadBodySchema,
};
