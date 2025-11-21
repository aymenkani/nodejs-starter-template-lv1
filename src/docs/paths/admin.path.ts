import { registry } from '../openAPIRegistry';
import { adminValidation } from '../../validations/admin.validation';
import { notificationValidation } from '../../validations/notification.validation';
import { authSchemas } from '../../validations/auth.validation';
import { z } from 'zod';

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users',
  summary: 'Get all users',
  description: 'Retrieve a list of all users. Requires admin access.',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    '200': {
      description: 'A list of users',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            count: z.number(),
            data: z.array(authSchemas.userSchema),
          }),
        },
      },
    },
    '401': {
      description: 'Unauthorized',
    },
    '403': {
      description: 'Forbidden',
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/admin/users/{userId}',
  summary: 'Update a user by ID',
  description: "Update an existing user's information. Requires admin access.",
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    params: adminValidation.updateUser.params,
    body: {
      content: {
        'application/json': {
          schema: adminValidation.updateUser.body,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: authSchemas.userSchema,
          }),
        },
      },
    },
    '400': {
      description: 'Bad request',
    },
    '401': {
      description: 'Unauthorized',
    },
    '403': {
      description: 'Forbidden',
    },
    '404': {
      description: 'Not Found',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/users/{userId}',
  summary: 'Delete a user by ID',
  description: 'Delete an existing user. Requires admin access.',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    params: adminValidation.deleteUser.params,
  },
  responses: {
    '204': {
      description: 'User deleted successfully. No content is returned.',
    },
    '401': {
      description: 'Unauthorized',
    },
    '403': {
      description: 'Forbidden',
    },
    '404': {
      description: 'Not Found',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/notifications',
  summary: 'Send notification to all users',
  description: 'Sends a notification message to all registered users. Requires admin access.',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: notificationValidation.sendNotification.body,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Notification sent successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    '401': {
      description: 'Unauthorized',
    },
    '403': {
      description: 'Forbidden',
    },
    '500': {
      description: 'Internal server error',
    },
  },
});
