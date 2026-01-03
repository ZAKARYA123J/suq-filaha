import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createChatSchema, sendMessageSchema, markReadSchema } from '../validators/chat.validator';

const router = Router();
const chatController = new ChatController();

router.get('/',authenticate, chatController.getUserChats);
router.get('/:chatId',authenticate, chatController.getChat);
// router.post('/', authenticate, validate(createChatSchema), chatController.createChat);
router.post('/:chatId/messages', authenticate, chatController.saveMessage);
router.patch('/:chatId/read',authenticate, validate(markReadSchema), chatController.markAsRead);

export default router;