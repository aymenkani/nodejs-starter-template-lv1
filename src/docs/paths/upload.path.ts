import { registry, errorResponseSchema } from '../openAPIRegistry';
import {
  generateSignedUrl,
  signedUrlResponseSchema,
  confirmUpload,
  confirmUploadResponseSchema,
} from '../../validations/upload.validation';

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

registry.registerPath({
  method: 'post',
  path: '/api/v1/upload/confirm',
  summary: 'Confirm file upload and start ingestion',
  tags: ['Upload'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: confirmUpload.body,
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Ingestion started successfully',
      content: {
        'application/json': {
          schema: confirmUploadResponseSchema,
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
