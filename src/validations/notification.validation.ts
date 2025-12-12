import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'; // 1. Import this

extendZodWithOpenApi(z); // Call this IMMEDIATELLY

const sendNotificationBodySchema = registry.register(
  'SendNotificationBody',
  z.object({
    message: z.string().min(1, 'Message is required'),
  }),
);

export const sendNotification = {
  body: sendNotificationBodySchema,
};

const notificationId = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const notificationValidation = {
  sendNotification,
  notificationId,
};
