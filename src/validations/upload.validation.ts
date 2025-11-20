import { z } from 'zod';

export const generateSignedUrl = {
  body: z.object({
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
};
