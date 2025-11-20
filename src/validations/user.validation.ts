import { z } from 'zod';

const updateEmail = {
  body: z.object({
    email: z.email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Current password is required' }),
  }),
};

export const userValidation = {
  updateEmail,
};
