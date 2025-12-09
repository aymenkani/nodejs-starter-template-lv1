import { registry, errorResponseSchema } from '../openAPIRegistry';
import { chat } from '../../validations/agent.validation';

registry.registerPath({
  method: 'post',
  path: '/api/v1/agent/chat',
  summary: 'Chat with the RAG agent',
  description:
    'Streams the response from the AI agent based on the provided messages. \n\n⚠️ Note: This endpoint streams data. Swagger UI will not show the typing effect. Please test this endpoint using curl -N or the provided frontend client.',
  tags: ['Agent'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: chat.body,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Streamed response',
      content: {
        'text/event-stream': {
          schema: {
            type: 'string',
            description: 'Streamed text chunks',
          },
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
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
