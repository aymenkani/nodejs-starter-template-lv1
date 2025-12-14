import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'data']),
  content: z.string(),
});

const chatBodySchema = registry.register(
  'ChatBody',
  z.object({
    messages: z.array(messageSchema).min(1),
  }),
);

export const chat = {
  body: chatBodySchema,
};

export const agentValidation = {
  chat,
};
