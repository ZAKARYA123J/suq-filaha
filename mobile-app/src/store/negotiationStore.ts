import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { phoenixService, NegotiationMessage } from '../services/phoenix';
import { useAuthStore } from '../store/authStore';

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
  // State
  currentNegotiation: Negotiation | null;
  messages: NegotiationMessage[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  isTyping: Record<string, boolean>;
  onlineUsers: string[];
  
  // Actions
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
    // Initial state
    currentNegotiation: null,
    messages: [],
    loading: false,
    connected: false,
    error: null,
    isTyping: {},
    onlineUsers: [],

    // Actions
    setCurrentNegotiation: (negotiation) => set({ currentNegotiation: negotiation }),

    connectToNegotiation: async (negotiationId: string): Promise<boolean> => {
      set({ loading: true, error: null });

      try {
        const success = await phoenixService.joinNegotiationChannel(negotiationId, {
          onPreviousMessages: (messages) => {
            set({ messages: messages.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ) });
          },
          
          onQueuedMessages: (queuedMessages) => {
            set(state => ({
              messages: [...state.messages, ...queuedMessages].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
            }));
          },
          
          onNewMessage: (message) => {
            set(state => ({
              messages: [...state.messages, message]
            }));
          },
          
          onUserJoined: (event) => {
            set(state => ({
              onlineUsers: [...state.onlineUsers.filter(id => id !== event.userId), event.userId]
            }));
          },
          
          onUserLeft: (event) => {
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
            // Update negotiation status
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
            set({ error: reason, loading: false });
          }
        });

        if (success) {
          set({ connected: true, loading: false });
        } else {
          set({ loading: false });
        }

        return success || false;
      } catch (error) {
        set({ error: 'Failed to connect to negotiation', loading: false });
        return false;
      }
    },

    disconnectFromNegotiation: () => {
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

    loadNegotiation: async (_negotiationId: string) => {
      set({ loading: true, error: null });

      try {
        // For now, we'll skip loading negotiation via API since it's not implemented
        // In a real implementation, you would call the API here
        set({ loading: false });
      } catch (_error) {
        set({ 
          error: 'Failed to load negotiation',
          loading: false 
        });
      }
    },

    clearError: () => set({ error: null })
  }))
);
