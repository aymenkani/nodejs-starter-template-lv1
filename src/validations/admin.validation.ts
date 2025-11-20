import { z } from 'zod';
import { Role } from '../generated/prisma';

const updateUser = {
  body: z.object({
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
  params: z.object({
    userId: z.uuid(),
  }),
};

const deleteUser = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

export const adminValidation = {
  updateUser,
  deleteUser,
};
