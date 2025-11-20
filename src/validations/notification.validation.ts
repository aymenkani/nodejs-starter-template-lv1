import { z } from 'zod';

const sendNotification = {
  body: z.object({
    message: z.string().min(1, 'Message is required'),
  }),
};

export const notificationValidation = {
  sendNotification,
};
