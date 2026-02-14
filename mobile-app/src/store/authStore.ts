import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api'; 

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
  lastAuthCheck: number | null;

  // registration
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
  refreshAuth: () => Promise<boolean>;
  setLastAuthCheck: (timestamp: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  chatToken: null,
  isAuthenticated: false,
  isLoading: true,
  lastAuthCheck: null,
  phoneNumber: '',
  isPhoneVerified: false,
  selectedUserType: null,


  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
  setPhoneVerified: (verified: boolean) => set({ isPhoneVerified: verified }),
  setUserType: (type: UserType) => set({ selectedUserType: type }),
  
  clearRegistrationFlow: () => set({
    phoneNumber: '',
    isPhoneVerified: false,
    selectedUserType: null,
  }),

  setLastAuthCheck: (timestamp: number) => set({ lastAuthCheck: timestamp }),

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
        lastAuthCheck: Date.now(),
      });
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  logout: async () => {
    try {
      // Clear all auth data
      await AsyncStorage.multiRemove(['auth_token', 'chat_token', 'user']);
      set({
        user: null,
        token: null,
        chatToken: null,
        isAuthenticated: false,
        phoneNumber: '',
        isPhoneVerified: false,
        selectedUserType: null,
        lastAuthCheck: null,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  loadAuth: async () => {
    try {
      const [token, chatToken, userStr] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('chat_token'),
        AsyncStorage.getItem('user'),
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          chatToken,
          isAuthenticated: true,
          isLoading: false,
          lastAuthCheck: Date.now(),
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
      await AsyncStorage.multiRemove(['auth_token', 'chat_token', 'user']);
      set({
        user: null,
        token: null,
        chatToken: null,
        isAuthenticated: false,
        isLoading: false,
        lastAuthCheck: null,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  refreshAuth: async (): Promise<boolean> => {
    try {
      // Try to get fresh user data using the profile endpoint
      const profileData = await apiClient.getMyProfile();
      
      if (profileData) {
        const { token, chatToken } = get();
        
        // Update user in state and storage
        await get().setUser(profileData.user || profileData);
        
        // If tokens were refreshed in the response, update them
        if (profileData.token) {
          await get().setAuth(
            profileData.user || profileData,
            profileData.token,
            profileData.chatToken || chatToken || undefined
          );
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return false;
    }
  },

  checkAuthValidity: async (): Promise<boolean> => {
    try {
      const { token, user, lastAuthCheck } = get();
            const now = Date.now();
      if (lastAuthCheck && (now - lastAuthCheck) < 5 * 60 * 1000) {
        console.log('Auth check skipped - recently validated');
        return true;
      }
      
      if (!token || !user) {
        const [storedToken, storedUserStr] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('user'),
        ]);
        
        if (!storedToken || !storedUserStr) {
          await get().clearAuth();
          return false;
        }
        
        try {
          const storedUser = JSON.parse(storedUserStr);
          if (!storedUser.id || !storedUser.phoneNumber) {
            await get().clearAuth();
            return false;
          }
          
          set({
            user: storedUser,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
            lastAuthCheck: now,
          });
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          await get().clearAuth();
          return false;
        }
      }
      
      const currentUser = get().user;
      if (!currentUser || !currentUser.id || !currentUser.phoneNumber || !currentUser.userType) {
        await get().clearAuth();
        return false;
      }
      
      try {
        const profileData = await apiClient.getMyProfile();
        
        if (profileData) {
          const updatedUser = profileData.user || profileData;
          if (updatedUser.id !== currentUser.id) {
            console.warn('User ID mismatch during auth check');
            await get().clearAuth();
            return false;
          }
          
          await get().setUser(updatedUser);
          set({ lastAuthCheck: now });
          return true;
        }
        
        set({ lastAuthCheck: now });
        return true;
        
      } catch (error: any) {
        console.error('Auth validation API error:', error);
        
        // Handle specific error cases
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 401) {
            console.log('Token invalid or expired');
            await get().clearAuth();
            return false;
          }
          
          if (error.response.status === 403) {
            console.log('User not authorized');
            await get().clearAuth();
            return false;
          }
    
          if (error.response.status >= 500) {
            console.warn('Server error, using cached auth data temporarily');
   
            set({ lastAuthCheck: now });
            return true;
          }
        }
        
        // Handle network errors
        if (!error.response) {
          console.warn('Network error, using cached auth data');
          // Allow offline mode with cached data
          // You might want to set a flag or state to indicate offline mode
          set({ lastAuthCheck: now });
          return true;
        }
        
        // For other errors, clear auth
        await get().clearAuth();
        return false;
      }
      
    } catch (error) {
      console.error('Unexpected error in checkAuthValidity:', error);
      await get().clearAuth();
      return false;
    }
  },
}));