import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this

extendZodWithOpenApi(z); // 2. Call this IMMEDIATELLY

const updateEmailBodySchema = registry.register(
  'UpdateEmailBody',
  z.object({
    email: z.email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Current password is required' }),
  }),
);

export const updateEmail = {
  body: updateEmailBodySchema,
};

export const userValidation = {
  updateEmail,
};
