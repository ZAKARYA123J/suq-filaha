import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export class ChatController {
  async getUserChats(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string || req.user!.userId;
      const chats = await chatService.getUserChats(userId);
      res.json(chats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getChat(req: AuthRequest, res: Response) {
    try {
      const chat = await chatService.getChat(req.params.chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      res.json(chat);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createChat(req: AuthRequest, res: Response) {
    try {
      const { user2Id } = req.body;
      const user1Id = req.user!.userId;
      const chat = await chatService.createChat(user1Id, user2Id);
      res.status(201).json(chat);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async saveMessage(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      if(!chatId){
        res.status(404).send({error:"chat id not found"})
      }
      console.log(chatId)
      const result = await chatService.saveMessage(chatId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const result = await chatService.markAsRead(chatId, req.body.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}