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
      where: { id: chatId },
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

    const newChat = await prisma.chat.create({
      data: {
        user1Id,
        user2Id,
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

    // Notify both users about the new chat
    await Promise.allSettled([
      realtimeClient.notifyUser(user1Id, 'chat_created', {
        chatId: newChat.id,
        otherUser: newChat.user2,
      }),
      realtimeClient.notifyUser(user2Id, 'chat_created', {
        chatId: newChat.id,
        otherUser: newChat.user1,
      }),
    ]);

    return newChat;
  }

  async saveMessage(chatId: string, messageData: any) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
      },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Create the message in the database
    const newMessage = await prisma.message.create({
      data: {
        chatId,
        senderId: messageData.senderId,
        content: messageData.content,
        isRead: false,
      },
    });

    // Update chat's last message info
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: messageData.content,
        lastMessageTime: new Date(messageData.timestamp || new Date()),
      },
    });

    // Determine the recipient
    const recipientId = chat.user1Id === messageData.senderId 
      ? chat.user2Id 
      : chat.user1Id;

    // Send real-time notifications
    await Promise.allSettled([
      // Notify the recipient about the new message
      // realtimeClient.notifyUser(recipientId, 'new_message', {
      //   chatId,
      //   message: newMessage,
      //   sender: chat.user1Id === messageData.senderId ? chat.user1 : chat.user2,
      // }),
      // Broadcast the message event to all participants in the chat
      realtimeClient.broadcastChatEvent(chatId, 'message_sent', {
        message: newMessage,
        senderId: messageData.senderId,
      }),
    ]);

    return { message: newMessage, chat: updatedChat };
  }

  async markAsRead(chatId: string, userId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: true,
      },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Get unread message IDs before updating
    const unreadMessages = await prisma.message.findMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      select: { id: true, senderId: true },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Notify the sender(s) that their messages were read
    if (unreadMessages.length > 0) {
      const senderIds = [...new Set(unreadMessages.map(msg => msg.senderId))];
      
      await Promise.allSettled(
        senderIds.map(senderId =>
          realtimeClient.notifyUser(senderId, 'messages_read', {
            chatId,
            readBy: userId,
            messageIds: unreadMessages
              .filter(msg => msg.senderId === senderId)
              .map(msg => msg.id),
          })
        )
      );

      // Broadcast read status to the chat
      await realtimeClient.broadcastChatEvent(chatId, 'messages_read', {
        readBy: userId,
        messageCount: unreadMessages.length,
      });
    }

    return { success: true, markedCount: unreadMessages.length };
  }

  async getOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
    try {
      const onlineUsers = await realtimeClient.getOnlineUsers();
      const onlineSet = new Set(onlineUsers);
      
      return userIds.reduce((acc, userId) => {
        acc[userId] = onlineSet.has(userId);
        return acc;
      }, {} as Record<string, boolean>);
    } catch (error) {
      console.error('Failed to get online status:', error);
      return {};
    }
  }
}