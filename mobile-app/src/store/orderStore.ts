// store/orderStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  deliveryDate: string;
  deliveryAddress: string;
  createdAt: string;
}

export interface ApiOrder {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  deliveryAddress: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  buyerId: string;
  farmerId: string;
  items: OrderItem[];
  buyer: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  farmer: {
    id: string;
    name: string;
    phoneNumber: string;
  };
}

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrdersFromApi: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
  clearOrders: () => Promise<void>;
}

const STORAGE_KEY = 'user_orders';

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ orders: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('fetchOrders', e);
      set({ error: 'Failed to load orders from storage' });
    } finally {
      set({ loading: false });
    }
  },

fetchOrdersFromApi: async () => {
  set({ loading: true, error: null });

  try {
    const apiOrders = await apiClient.getOrders();

    if (!Array.isArray(apiOrders)) {
      console.error('fetchOrdersFromApi: Invalid response', apiOrders);
      set({ orders: [] });
      return;
    }

    const transformedOrders: Order[] = apiOrders.map((apiOrder: any) => ({
      id: apiOrder.id,
      status: apiOrder.status,
      totalAmount: Number(apiOrder.totalAmount.toFixed(2)),
      orderDate: apiOrder.orderDate,
      deliveryDate: apiOrder.deliveryDate,
      deliveryAddress: apiOrder.deliveryAddress,
      createdAt: apiOrder.createdAt,
      items: apiOrder.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.product?.name ?? 'Unknown product',
        image: item.product?.images?.[0],
        quantity: item.quantity,
        price: Number(item.price.toFixed(2)),
        total: Number(item.total.toFixed(2)),
      })),
    }));

    set({ orders: transformedOrders });

  } catch (error) {
    console.error('fetchOrdersFromApi', error);
    set({ error: 'Failed to fetch orders from server' });
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

  clearOrders: async () => {
    set({ orders: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('clearOrders', e);
    }
  },
}));