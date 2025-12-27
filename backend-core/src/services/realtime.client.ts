import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';

export class RealtimeClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.phoenixUrl,
      headers: {
        'X-API-Key': config.phoenixApiKey,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  async notifyUser(userId: string, type: string, data: any): Promise<void> {
    try {
      await this.axiosInstance.post('/api/webhooks/notify', {
        user_id: userId,
        type: type,
        data: data,
      });
    } catch (error) {
      console.error('Failed to send realtime notification:', error);
    }
  }

  async broadcastChatEvent(chatId: string, event: string, data: any): Promise<void> {
    try {
      await this.axiosInstance.post('/api/webhooks/chat-event', {
        chat_id: chatId,
        event: event,
        data: data,
      });
    } catch (error) {
      console.error('Failed to broadcast chat event:', error);
    }
  }

  async getOnlineUsers(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/api/webhooks/online-users');
      return response.data.online_users || [];
    } catch (error) {
      console.error('Failed to get online users:', error);
      return [];
    }
  }
}

export const realtimeClient = new RealtimeClient();