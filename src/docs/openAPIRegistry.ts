import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this

extendZodWithOpenApi(z); // 2. Call this IMMEDIATELLY

export const registry = new OpenAPIRegistry();

// Define the error response schema
export const errorResponseSchema = z.object({
  code: z.number().int().describe('HTTP status code'),
  message: z.string().describe('A human-readable error message'),
  stack: z.string().optional().describe('Stack trace (only in development environment)'),
});

// Register the error response schema
registry.register('ErrorResponse', errorResponseSchema);