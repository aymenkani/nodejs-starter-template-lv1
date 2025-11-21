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
      .refine((val) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(val), {
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.',
      }),
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

export const generateSignedUrl = {
  body: generateSignedUrlBodySchema,
};
