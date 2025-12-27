import { z } from 'zod';

export const createChatSchema = z.object({
  user2Id: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  senderId: z.string().uuid(),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
});

export const markReadSchema = z.object({
  userId: z.string().uuid(),
});
