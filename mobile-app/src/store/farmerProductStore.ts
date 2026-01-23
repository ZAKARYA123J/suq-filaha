import { create } from 'zustand';
import { Product } from '../types';
import { apiClient } from '../services/api';

interface FarmerProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchMyProducts: (isAvailable?: boolean) => Promise<void>;
  createProduct: (formData: FormData) => Promise<Product>;
  updateProduct: (id: string, formData: FormData) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFarmerProductStore = create<FarmerProductState>((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchMyProducts: async (isAvailable?: boolean) => {
    set({ loading: true, error: null });
    try {
      const products = await apiClient.getMyProducts(isAvailable);
      set({ products, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProduct: async (formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const product = await apiClient.createProduct(formData);
      set(state => ({
        products: [product, ...state.products],
        loading: false
      }));
      return product;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProduct: async (id: string, formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const product = await apiClient.updateProduct(id, formData);
      set(state => ({
        products: state.products.map(p => p.id === id ? product : p),
        loading: false
      }));
      return product;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.deleteProduct(id);
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  toggleProductAvailability: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const product = await apiClient.toggleProductAvailability(id);
      set(state => ({
        products: state.products.map(p => p.id === id ? product : p),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));