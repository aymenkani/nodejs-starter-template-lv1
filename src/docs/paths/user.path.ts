import { errorResponseSchema, registry } from '../openAPIRegistry';
import { userValidation } from '../../validations/user.validation';
import { authSchemas } from '../../validations/auth.validation';
import { z } from 'zod';

const userResponseSchema = registry.register(
  'UserResponse',
  z.object({
    success: z.boolean(),
    data: authSchemas.userSchema,
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/profile',
  summary: 'Get user profile',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  responses: {
    '200': {
      description: 'User profile retrieved successfully',
      content: {
        'application/json': {
          schema: userResponseSchema,
        },
      },
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': { 
          schema: errorResponseSchema
        }
      }
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/users/profile/email',
  summary: "Update user's email",
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: userValidation.updateEmail.body,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User profile updated successfully',
      content: {
        'application/json': {
          schema: userResponseSchema,
        },
      },
    },
    '400': {
      description: 'Bad request',
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': { 
          schema: errorResponseSchema
        }
      }
    },
    '404': {
      description: 'User not found',
    },
  },
});
