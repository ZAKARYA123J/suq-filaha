import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Order {
  id: string;
  items: { productId: string; qty: number; price: number }[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

interface OrderState {
  orders: Order[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
}

const STORAGE_KEY = 'user_orders';

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ orders: JSON.parse(raw) });
    } catch (e) {
      console.error('fetchOrders', e);
    } finally {
      set({ loading: false });
    }
  },

  addOrder: async (payload) => {
    const newOrder: Order = {
      ...payload,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().orders, newOrder];
    set({ orders: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('addOrder', e);
    }
  },
}));