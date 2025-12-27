import prisma from '../config/database';
import { realtimeClient } from './realtime.client';

export class ChatService {
  async getUserChats(userId: string) {
    return await prisma.chat.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
      orderBy: {
        lastMessageTime: 'desc',
      },
    });
  }

  async getChat(chatId: string) {
    return await prisma.chat.findUnique({
      where: {id:chatId },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
    });
  }

  async createChat(user1Id: string, user2Id: string) {
    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });

    if (existingChat) {
      return existingChat;
    }

    return await prisma.chat.create({
      data: {
        user1Id,
        user2Id,
        // messages: [],
        lastMessageTime: new Date(),
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
    });
  }

  async saveMessage(chatId: string, messageData: any) {
    const chat = await prisma.chat.findUnique({
      where: { id:chatId },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    const newMessage = {
      id: crypto.randomUUID(),
      senderId: messageData.senderId,
      content: messageData.content,
      timestamp: messageData.timestamp,
      read: false,
    };

    const updatedChat = await prisma.chat.update({
      where: { id:chatId },
      data: {
 messages: {
      connect: { id: newMessage.id }
    },        lastMessage: messageData.content,
        lastMessageTime: new Date(messageData.timestamp),
      },
    });

    return { message: newMessage, chat: updatedChat };
  }

  async markAsRead(chatId: string, userId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id:chatId },
      include:{
        messages:true
      }
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    await prisma.message.updateMany({
    where: {
      chatId,
      senderId: { not: userId },
          isRead:false

    },
    data: {
    isRead:true
    }
  });

  return { success: true };
  }
}
