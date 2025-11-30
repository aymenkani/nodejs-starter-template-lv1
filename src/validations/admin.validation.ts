import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { Role } from '@prisma/client';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this

extendZodWithOpenApi(z); // 2. Call this IMMEDIATELLY

const updateUserBodySchema = registry.register(
  'UpdateUserBody',
  z.object({
    email: z.email().optional(),
    username: z.string().optional(),
    role: z.enum(Role).optional(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
      })
      .optional(), // Made password optional
  }),
);

const userParamsSchema = registry.register(
  'UserParams',
  z.object({
    userId: z.uuid(),
  }),
);

export const updateUser = {
  body: updateUserBodySchema,
  params: userParamsSchema,
};

export const deleteUser = {
  params: userParamsSchema,
};

export const adminValidation = {
  updateUser,
  deleteUser,
};
