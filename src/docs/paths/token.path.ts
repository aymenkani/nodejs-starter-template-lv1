import { registry, errorResponseSchema } from '../openAPIRegistry';
import { authSchemas } from '../../validations/auth.validation';

registry.registerPath({
  method: 'post',
  path: '/api/v1/token/refresh',
  summary: 'Refresh auth tokens',
  tags: ['Token'],
  responses: {
    '200': {
      description: 'Tokens refreshed successfully',
      content: {
        'application/json': {
          schema: authSchemas.refreshResponseSchema,
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
