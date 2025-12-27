import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createChatSchema, sendMessageSchema, markReadSchema } from '../validators/chat.validator';

const router = Router();
const chatController = new ChatController();

router.get('/', chatController.getUserChats);
router.get('/:chatId', chatController.getChat);
router.post('/', authenticate, validate(createChatSchema), chatController.createChat);
router.post('/:chatId/messages', validate(sendMessageSchema), chatController.saveMessage);
router.patch('/:chatId/read', validate(markReadSchema), chatController.markAsRead);

export default router;