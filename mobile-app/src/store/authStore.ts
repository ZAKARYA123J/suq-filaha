import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserType = 'FARMER' | 'BUYER';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  userType: UserType;
  location?: string;
  rating: number;
  profileInfo?: string;
  registrationDate: string;
  avatar: string;
}

interface AuthState {
  // state
  user: User | null;
  token: string | null;
  chatToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // registrtion
  phoneNumber: string;
  isPhoneVerified: boolean;
  selectedUserType: UserType | null;

  // actions
  setPhoneNumber: (phone: string) => void;
  setPhoneVerified: (verified: boolean) => void;
  setUserType: (type: UserType) => void;
  setAuth: (user: User, token: string, chatToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
  clearRegistrationFlow: () => void;
  clearAuth: () => Promise<void>;
  checkAuthValidity: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  chatToken: null,
  isAuthenticated: false,
  isLoading: true,
  phoneNumber: '',
  isPhoneVerified: false,
  selectedUserType: null,

  // Registration flow actions
  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
  setPhoneVerified: (verified: boolean) => set({ isPhoneVerified: verified }),
  setUserType: (type: UserType) => set({ selectedUserType: type }),
  
  clearRegistrationFlow: () => set({
    phoneNumber: '',
    isPhoneVerified: false,
    selectedUserType: null,
  }),

  setAuth: async (user: User, token: string, chatToken?: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (chatToken) {
        await AsyncStorage.setItem('chat_token', chatToken);
      }
      set({
        user,
        token,
        chatToken: chatToken || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('chat_token');
      await AsyncStorage.removeItem('user');
      set({
        user: null,
        token: null,
        chatToken: null,
        isAuthenticated: false,
        phoneNumber: '',
        isPhoneVerified: false,
        selectedUserType: null,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const chatToken = await AsyncStorage.getItem('chat_token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          chatToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      set({ isLoading: false });
    }
  },

  setUser: async (user: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  },


  clearAuth: async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('chat_token');
      await AsyncStorage.removeItem('user');
      set({
        user: null,
        token: null,
        chatToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  checkAuthValidity: async () => {
    try {
      const { token, user } = get();
      
      // Check if both token and user exist in state
      if (!token || !user) {
        // Try loading from storage
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUserStr = await AsyncStorage.getItem('user');
        
        if (!storedToken || !storedUserStr) {
          await get().clearAuth();
          return false;
        }
        
        // Validate stored user data
        try {
          const storedUser = JSON.parse(storedUserStr);
          if (!storedUser.id || !storedUser.phoneNumber) {
            await get().clearAuth();
            return false;
          }
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          await get().clearAuth();
          return false;
        }
        
        // Data exists in storage, reload it
        await get().loadAuth();
        return true;
      }
      
      // Validate user object has required fields
      if (!user.id || !user.phoneNumber || !user.userType) {
        await get().clearAuth();
        return false;
      }
      
      // Optional: Add token expiration check here if your tokens have expiry
      // You could decode a JWT token and check its exp claim
      
      return true;
    } catch (error) {
      console.error('Error checking auth validity:', error);
      await get().clearAuth();
      return false;
    }
  },
}));