import { registry } from '../openAPIRegistry';
import { authSchemas } from '../../validations/auth.validation';
import { z } from 'zod';

// Generic Error Response Schema
const errorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    message: z.string(),
    stack: z.string().optional(),
  }),
);

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: 'Register a new user',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: authSchemas.registerBodySchema,
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: authSchemas.authResponseSchema,
        },
      },
    },
    '400': {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'Login a user',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: authSchemas.loginBodySchema,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User logged in successfully',
      content: {
        'application/json': {
          schema: authSchemas.authResponseSchema,
        },
      },
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  summary: 'Logout a user',
  description:
    'Logout a user (refresh token should be in cookie after successful login or register)',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  responses: {
    '204': {
      description: 'User logged out successfully',
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/request-password-reset',
  summary: 'Request password reset',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: authSchemas.requestPasswordResetBodySchema,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Password reset email sent',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    '400': {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/reset-password',
  summary: 'Reset password',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: authSchemas.resetPasswordBodySchema,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Password reset successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    '400': {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    '401': {
      description: 'Invalid or expired token',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google',
  summary: 'Redirect to Google for authentication',
  description:
    'Redirect to Google for authentication (refresh token will be saved automatically in the browser for the Host localhost:5001)',
  tags: ['Auth'],
  responses: {
    '302': {
      description: "Redirecting to Google's OAuth 2.0 server.",
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google/callback',
  summary: 'Google OAuth callback',
  tags: ['Auth'],
  responses: {
    '200': {
      description: 'User authenticated successfully. Returns user and tokens.',
      content: {
        'application/json': {
          schema: authSchemas.authResponseSchema,
        },
      },
    },
    '401': {
      description: 'Authentication failed.',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/verify-reset-token',
  summary: 'Verify password reset token validity',
  tags: ['Auth'],
  request: {
    query: authSchemas.verifyResetTokenQuerySchema,
  },
  responses: {
    '200': {
      description: 'Token is valid',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            success: z.boolean(),
          }),
        },
      },
    },
    '400': {
      description: 'Invalid or expired token',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});