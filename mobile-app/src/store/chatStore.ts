import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  loadMessages: () => Promise<void>;
  sendMessage: (msg: Message) => Promise<void>;
}

const STORAGE_KEY = 'chat_messages';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  loadMessages: async () => {
    set({ loading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ messages: JSON.parse(raw) });
    } catch (e) {
      console.error('loadMessages', e);
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (msg: Message) => {
    const updated = [...get().messages, msg];
    set({ messages: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('sendMessage', e);
    }
  },
}));