import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const listFilesParamsSchema = registry.register(
  'ListFilesParams',
  z.object({
    filter: z.enum(['mine', 'public', 'all']).optional(),
  }),
);

export const listFiles = {
  query: listFilesParamsSchema,
};
