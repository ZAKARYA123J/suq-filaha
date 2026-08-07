import { z } from 'zod';

export const createChatSchema = z.object({
  user2Id: z.string(),
});

export const sendMessageSchema = z.object({
  senderId: z.string(),
  content: z.string().min(1),
  timestamp: z.string(),
});

export const markReadSchema = z.object({
  userId: z.string(),
});