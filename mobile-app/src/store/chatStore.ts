// store/chatStore.ts
import { create } from 'zustand';
import { Socket, Channel } from 'phoenix';
import { apiClient } from '../services/api';
import { useAuthStore } from './authStore';
import { Platform } from 'react-native';

const CHAT_SOCKET_URL_OVERRIDE = 'ws://192.168.1.33:4000/socket';

const getChatSocketUrl = (): string => {
  if (CHAT_SOCKET_URL_OVERRIDE) return CHAT_SOCKET_URL_OVERRIDE;

  const baseURL = apiClient.client.defaults.baseURL;
  if (!baseURL) {
    return Platform.OS === 'android'
      ? 'ws://10.0.2.2:4000/socket'
      : 'ws://localhost:4000/socket';
  }

  try {
    const match = baseURL.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);
    const origin = match?.[1];
    if (!origin) return 'ws://localhost:4000/socket';

    const wsOrigin = origin.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');

    const androidPatchedOrigin =
      Platform.OS === 'android'
        ? wsOrigin.replace('ws://localhost', 'ws://10.0.2.2').replace('ws://127.0.0.1', 'ws://10.0.2.2')
        : wsOrigin;

    return `${androidPatchedOrigin}/socket`;
  } catch {
    return Platform.OS === 'android'
      ? 'ws://10.0.2.2:4000/socket'
      : 'ws://localhost:4000/socket';
  }
};

export interface ChatUser {
  id: string;
  name: string;
  profileInfo: string | null;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isRead?: boolean;
}

interface ChatRoom {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: ChatUser;
  user2: ChatUser;
}

export interface ChatListItem {
  id: string;
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
  updatedAt: string;
  user1Id: string;
  user2Id: string;
  user1: ChatUser;
  user2: ChatUser;
}

interface ChatState {
  chatRoom: ChatRoom | null;
  messages: Message[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  socket: Socket | null;
  channel: Channel | null;
  onlineUsers: string[];
  
  // Actions
  loadChats: () => Promise<ChatListItem[]>;
  initializeSocket: () => void;
  connectToChat: (chatId: string) => Promise<void>;
  disconnectFromChat: () => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatRoom: null,
  messages: [],
  loading: false,
  connected: false,
  error: null,
  socket: null,
  channel: null,
  onlineUsers: [],

  // Load all chats for the current user
  loadChats: async () => {
    try {
      const response = await apiClient.client.get('/chats');
      return response.data; // This should return the array of chat objects
    } catch (error) {
      console.error('Error loading chats:', error);
      throw error;
    }
  },

  initializeSocket: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    const token = useAuthStore.getState().chatToken || useAuthStore.getState().token;
    if (!token) {
      set({ error: 'Missing auth token for chat socket', connected: false });
      return;
    }

    const socketUrl = getChatSocketUrl();
    console.log('Chat socket URL:', socketUrl);

    const socket = new Socket(socketUrl, {
      params: { token },
    });

    socket.connect();

    socket.onOpen(() => {
      console.log('Socket connected');
      set({ socket, connected: true });
    });

    socket.onError((error) => {
      console.error('Socket error:', error);
      set({ error: 'Socket connection failed', connected: false });
    });

    socket.onClose(() => {
      console.log('Socket closed');
      set({ connected: false, channel: null });
    });
  },

  connectToChat: async (chatId: string) => {
    const { socket } = get();
    if (!socket) {
      get().initializeSocket();
      // Wait a bit for socket connection
      await new Promise((resolve:any) => setTimeout(resolve, 1000));
    }

    const { socket: connectedSocket } = get();
    if (!connectedSocket) {
      set({ error: 'Failed to connect to socket' });
      return;
    }

    // Ensure chatRoom is set for sendMessage API persistence
    const currentChatRoom = get().chatRoom;
    if (!currentChatRoom || currentChatRoom.id !== chatId) {
      set({ chatRoom: { id: chatId } as any });
    }

    const channel = connectedSocket.channel(`chat:${chatId}`, {});
    
    channel.join()
      .receive('ok', () => {
        console.log('Joined chat channel');
        set({ channel, connected: true, error: null });
      })
      .receive('error', (error) => {
        console.error('Failed to join channel:', error);
        set({ error: 'Failed to join chat', connected: false });
      });

    // Listen for new messages
    const normalizeRealtimeMessage = (payload: any): Message | null => {
      // From realtime_gateway ChatChannel
      if (payload?.id && (payload?.body || payload?.inserted_at) && payload?.userId) {
        return {
          id: payload.id,
          text: payload.body,
          senderId: payload.userId,
          timestamp: payload.inserted_at || new Date().toISOString(),
          isRead: false,
        };
      }

      // From backend webhook broadcastChatEvent("message_sent")
      if (payload?.message?.id) {
        return {
          id: payload.message.id,
          text: payload.message.content,
          senderId: payload.message.senderId,
          timestamp: payload.message.createdAt || new Date().toISOString(),
          isRead: payload.message.isRead ?? false,
        };
      }

      return null;
    };

    const upsertIncomingMessage = (payload: any) => {
      const msg = normalizeRealtimeMessage(payload);
      if (!msg) return;

      set((state) => {
        const withoutDupTemp = state.messages.filter((m) => {
          if (!m.id.startsWith('temp-')) return true;
          if (m.senderId !== msg.senderId) return true;
          return m.text !== msg.text;
        });

        if (withoutDupTemp.some((m) => m.id === msg.id)) {
          return { messages: withoutDupTemp };
        }

        return { messages: [...withoutDupTemp, msg] };
      });
    };

    channel.on('new_message', upsertIncomingMessage);
    channel.on('message_sent', upsertIncomingMessage);

    // Listen for message read updates
    // Backend currently broadcasts "messages_read" without messageIds; keep placeholder for future compatibility

    // Listen for user presence
    channel.on('presence_state', (state) => {
      const onlineUsers = Object.keys(state);
      set({ onlineUsers });
    });

    channel.on('presence_diff', (diff) => {
      console.log('Presence diff:', diff);
    });

    // Best-effort: mark messages as read once connected
    get().markAsRead(chatId).catch(() => undefined);
  },

  disconnectFromChat: () => {
    const { channel } = get();
    if (channel) {
      channel.leave();
    }
    set({ channel: null, connected: false });
  },

  sendMessage: async (messageData) => {
    const { channel } = get();
    if (!channel) {
      set({ error: 'Not connected to chat' });
      return;
    }

    try {
      // Optimistically add the message
      const tempMessage: Message = {
        ...messageData,
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      set((state) => ({
        messages: [...state.messages, tempMessage],
      }));

      // Send via WebSocket
      channel.push('new_message', { body: messageData.text });
      
      // Also send via API for persistence
      const chatId = get().chatRoom?.id;
      if (!chatId) {
        throw new Error('Missing chatId');
      }
      await apiClient.client.post(`/chats/${chatId}/messages`, {
        senderId: messageData.senderId,
        content: messageData.text,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: 'Failed to send message' });
    }
  },

  loadMessages: async (chatId: string) => {
    set({ loading: true });
    try {
      const response = await apiClient.client.get(`/chats/${chatId}`);
      const chat = response.data;
      const messages: Message[] = (chat?.messages || []).map((m: any) => ({
        id: m.id,
        text: m.content,
        senderId: m.senderId,
        timestamp: m.createdAt,
        isRead: m.isRead,
      }));
      set({
        messages,
        chatRoom: chat,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading messages:', error);
      set({ error: error.response?.data?.error || 'Failed to load messages' });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (chatId: string) => {
    try {
      const { user } = useAuthStore.getState();
      if (!user?.id) return;
      await apiClient.client.patch(`/chats/${chatId}/read`, { userId: user.id });

      // Optimistically update local state (backend marks "messages from other users" as read)
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId !== user.id ? { ...msg, isRead: true } : msg
        ),
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  resetChat: () => {
    const { channel } = get();
    if (channel) {
      channel.leave();
    }
    set({
      messages: [],
      chatRoom: null,
      loading: false,
      error: null,
      channel: null,
      onlineUsers: [],
    });
  },
}));