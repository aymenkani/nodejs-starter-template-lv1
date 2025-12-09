import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './openAPIRegistry';
import './paths/auth.path'; // Import all path definitions
import './paths/token.path'; // Import all path definitions
import './paths/upload.path'; // Import all path definitions
import './paths/user.path'; // Import all path definitions
import './paths/admin.path'; // Import all path definitions
import './paths/agent.paths'; // Import all path definitions

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation for the application',
  },
  servers: [
    {
      url: '/',
      description: 'Development server',
    },
  ],
});
