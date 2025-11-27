import { registry, errorResponseSchema } from '../openAPIRegistry';
import { generateSignedUrl, signedUrlResponseSchema } from '../../validations/upload.validation';

registry.registerPath({
  method: 'post',
  path: '/api/v1/upload/generate-signed-url',
  summary: 'Generate a signed URL for file upload',
  tags: ['Upload'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: generateSignedUrl.body,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Signed URL generated successfully',
      content: {
        'application/json': {
          schema: signedUrlResponseSchema,
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
          schema: errorResponseSchema,
        },
      },
    },
  },
});
