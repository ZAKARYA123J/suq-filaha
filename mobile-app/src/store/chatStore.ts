import { create } from 'zustand';
import { Socket, Channel } from 'phoenix';
import { useAuthStore } from './authStore';
interface ChatUser {
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
interface ChatState {
    chatRoom: ChatRoom | null; // <-- add this
  messages: Message[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  socket: Socket | null;
  channel: Channel | null;
  onlineUsers: string[];
  
  // Actions
  initializeSocket: () => void;
  connectToChat: (chatId: string) => void;
  disconnectFromChat: () => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  loadMessages: (chatId:string) => void;
  markAsRead: (messageIds: string[]) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatRoom: null, // <-- initialize here
  messages: [],
  loading: false,
  connected: false,
  error: null,
  socket: null,
  channel: null,
  onlineUsers: [],

  initializeSocket: () => { /* ... */ },
  connectToChat: (chatId) => { /* ... */ },
  disconnectFromChat: () => { /* ... */ },
  sendMessage: (message) => { /* ... */ },
  
  loadMessages: async (chatId: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`https://macbook.euplectes-rockhopper.ts.net/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });

      if (response.ok) {
        const data = await response.json(); // expects { chatRoom, messages }
        set({ messages: data.messages, chatRoom: data.chatRoom }); // <-- set chatRoom here
      } else {
        set({ error: 'Failed to load messages' });
      }
    } catch (err) {
      console.error(err);
      set({ error: 'Failed to load messages' });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: (messageIds) => { /* ... */ },
  resetChat: () => { 
    set({
      messages: [],
      chatRoom: null, // <-- reset chatRoom too
      loading: false,
      error: null,
      channel: null,
      onlineUsers: [],
    });
  },
}));
