import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { phoenixService, NegotiationMessage } from '../services/phoenix';
import { apiClient } from '../services/api';

export interface Negotiation {
  id: string;
  originalPrice: number;
  proposedPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  startTime: string;
  updatedAt: string;
  productId: string;
  product: any;
  buyerId: string;
  buyer: any;
  farmerId: string;
  farmer: any;
}

export interface NegotiationStore {
  currentNegotiation: Negotiation | null;
  messages: NegotiationMessage[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  isTyping: Record<string, boolean>;
  onlineUsers: string[];
  
  // actions
  setCurrentNegotiation: (negotiation: Negotiation | null) => void;
  connectToNegotiation: (negotiationId: string) => Promise<boolean>;
  disconnectFromNegotiation: () => void;
  sendMessage: (content: string) => boolean;
  sendTyping: (typing: boolean) => void;
  endNegotiation: (status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => boolean;
  loadNegotiation: (negotiationId: string) => Promise<void>;
  clearError: () => void;
}

export const useNegotiationStore = create<NegotiationStore>()(
  subscribeWithSelector((set, get) => ({
    currentNegotiation: null,
    messages: [],
    loading: false,
    connected: false,
    error: null,
    isTyping: {},
    onlineUsers: [],


    setCurrentNegotiation: (negotiation) => set({ currentNegotiation: negotiation }),

    connectToNegotiation: async (negotiationId: string): Promise<boolean> => {
      console.log('🔄 Connecting to negotiation:', negotiationId);
      set({ loading: true, error: null });

      try {
        console.log('📡 Fetching negotiation data...');
        const negotiationData = await apiClient.getNegotiation(negotiationId);
        console.log('✅ Negotiation data received:', negotiationData);
        
        // ✅ STEP 2: Set the negotiation in store
        set({ currentNegotiation: negotiationData });

        // ✅ STEP 3: Now connect to Phoenix channel
        console.log('🔌 Connecting to Phoenix channel...');
        const success = await phoenixService.joinNegotiationChannel(negotiationId, {
          onPreviousMessages: (messages) => {
            console.log('📨 Previous messages received:', messages.length);
            set({ messages: messages.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ) });
          },
          
          onQueuedMessages: (queuedMessages) => {
            console.log('📬 Queued messages received:', queuedMessages.length);
            set(state => ({
              messages: [...state.messages, ...queuedMessages].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
            }));
          },
          
          onNewMessage: (message) => {
            console.log('💬 New message received:', message);
            set(state => ({
              messages: [...state.messages, message]
            }));
          },
          
          onUserJoined: (event) => {
            console.log('👋 User joined:', event.userId);
            set(state => ({
              onlineUsers: [...state.onlineUsers.filter(id => id !== event.userId), event.userId]
            }));
          },
          
          onUserLeft: (event) => {
            console.log('👋 User left:', event.userId);
            set(state => ({
              onlineUsers: state.onlineUsers.filter(id => id !== event.userId),
              isTyping: { ...state.isTyping, [event.userId]: false }
            }));
          },
          
          onTyping: (event) => {
            set(state => ({
              isTyping: { ...state.isTyping, [event.userId]: event.typing }
            }));
          },
          
          onNegotiationEnded: (event) => {
            console.log('🏁 Negotiation ended:', event.status);
            const { currentNegotiation } = get();
            if (currentNegotiation && currentNegotiation.id === event.negotiationId) {
              set({
                currentNegotiation: {
                  ...currentNegotiation,
                  status: event.status as any
                }
              });
            }
          },
          
          onError: (reason: string) => {
            console.error('❌ Phoenix error:', reason);
            set({ error: reason, loading: false });
          }
        });

        if (success) {
          console.log('✅ Successfully connected to Phoenix channel');
          set({ connected: true, loading: false });
        } else {
          console.error('❌ Failed to connect to Phoenix channel');
          set({ error: 'Failed to connect to channel', loading: false });
        }

        return success || false;
      } catch (error: any) {
        console.error('❌ Connect to negotiation error:', error);
        set({ 
          error: error.message || 'Failed to connect to negotiation', 
          loading: false 
        });
        return false;
      }
    },

    disconnectFromNegotiation: () => {
      console.log('🔌 Disconnecting from negotiation');
      phoenixService.leaveNegotiationChannel();
      set({
        connected: false,
        messages: [],
        isTyping: {},
        onlineUsers: [],
        currentNegotiation: null
      });
    },

    sendMessage: (content: string) => {
      const success = phoenixService.sendMessage(content);
      if (!success) {
        set({ error: 'Failed to send message - not connected' });
      }
      return success;
    },

    sendTyping: (typing: boolean) => {
      const success = phoenixService.sendTyping(typing);
      return success;
    },

    endNegotiation: (status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
      const success = phoenixService.endNegotiation(status);
      if (!success) {
        set({ error: 'Failed to end negotiation - not connected' });
      }
      return success;
    },

    loadNegotiation: async (negotiationId: string) => {
      set({ loading: true, error: null });

      try {
        const negotiationData = await apiClient.getNegotiation(negotiationId);
        set({ 
          currentNegotiation: negotiationData,
          loading: false 
        });
      } catch (error: any) {
        console.error('Failed to load negotiation:', error);
        set({ 
          error: error.message || 'Failed to load negotiation',
          loading: false 
        });
      }
    },

    clearError: () => set({ error: null })
  }))
);