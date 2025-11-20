import { z } from 'zod';

const register = {
  body: z.object({
    email: z.email(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
      }),
    username: z.string(),
  }),
};

const login = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};

const logout = {
  cookies: z.object({
    refreshToken: z.string(),
  }),
};

const refreshTokens = {
  cookies: z.object({
    refreshToken: z.string(),
  }),
};

const requestPasswordReset = {
  body: z.object({
    email: z.email(),
  }),
};

const resetPassword = {
  body: z.object({
    token: z.string(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
      }),
  }),
};

const verifyResetToken = {
  query: z.object({
    token: z.uuid({ message: 'Token must be a valid UUID' }), // Assuming opaque token is a UUID
  }),
};

export const authValidation = {
  register,
  login,
  logout,
  refreshTokens,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
};
