import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this
import { Role } from '@prisma/client';

extendZodWithOpenApi(z); // Call this IMMEDIATELLY

// User Schema
const userSchema = registry.register(
  'User',
  z.object({
    id: z.uuid(),
    username: z.string(),
    email: z.email(),
    role: z.enum([Role.USER, Role.ADMIN]),
    googleId: z.string().optional(),
    provider: z.enum(['LOCAL', 'GOOGLE']),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

// Token Schema
const tokenSchema = registry.register(
  'Token',
  z.object({
    token: z.string(),
    expires: z.date(),
  }),
);

// This schema represents the full tokens object, including the refresh token.
// It's not directly exposed in the response body, but used internally.
const fullTokensSchema = z.object({
  access: tokenSchema,
  refresh: tokenSchema,
});

// AuthResponse Schema
const authResponseSchema = registry.register(
  'AuthResponse',
  z.object({
    user: userSchema,
    access: tokenSchema,
  }),
);

// RefreshResponse Schema
const refreshResponseSchema = registry.register(
  'RefreshResponse',
  z.object({
    access: tokenSchema,
  }),
);

// Register Body Schema
const registerBodySchema = registry.register(
  'RegisterBody',
  z.object({
    email: z.email(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
      })
      .default('password123'),
    username: z.string(),
  }),
);

const register = {
  body: registerBodySchema,
};

// Login Body Schema
const loginBodySchema = registry.register(
  'LoginBody',
  z.object({
    email: z.email(),
    password: z.string(),
  }),
);

const login = {
  body: loginBodySchema,
};

const logout = {
  cookies: z.object({
    refreshToken: z.string(),
  }),
};

const refreshTokens = {
  cookies: z.object({
    refreshToken: z.string('refresh token is required'),
  }),
};

// Request Password Reset Body Schema
const requestPasswordResetBodySchema = registry.register(
  'RequestPasswordResetBody',
  z.object({
    email: z.email(), // A reset token is going to be sent to this email address
  }),
);

const requestPasswordReset = {
  body: requestPasswordResetBodySchema,
};

// Reset Password Body Schema
const resetPasswordBodySchema = registry.register(
  'ResetPasswordBody',
  z.object({
    token: z.string(), // reset password token
    password: z // new password
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
      }),
  }),
);

const resetPassword = {
  body: resetPasswordBodySchema,
};

// Verify Reset Token Query Schema
const verifyResetTokenQuerySchema = registry.register(
  'VerifyResetTokenQuery',
  z.object({
    token: z.uuid({ message: 'Token must be a valid UUID' }),
  }),
);

const verifyResetToken = {
  query: verifyResetTokenQuerySchema,
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

// Schemas for documentation purposes
export const authSchemas = {
  userSchema,
  tokenSchema,
  authResponseSchema,
  registerBodySchema,
  loginBodySchema,
  requestPasswordResetBodySchema,
  resetPasswordBodySchema,
  verifyResetTokenQuerySchema,
  refreshResponseSchema,
};
