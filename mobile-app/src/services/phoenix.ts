import { Socket, Channel } from 'phoenix';
import { useAuthStore } from '../store/authStore';

// Update this to your Phoenix server URL
const PHOENIX_URL = 'ws://192.168.1.160:4000/socket';

export interface NegotiationMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'FARMER' | 'BUYER';
  createdAt: string;
}

export interface TypingEvent {
  userId: string;
  negotiationId: string;
  typing: boolean;
}

export interface UserJoinedEvent {
  userId: string;
  negotiationId: string;
  joinedAt: string;
}

export interface UserLeftEvent {
  userId: string;
  negotiationId: string;
  leftAt: string;
}

export interface NegotiationEndedEvent {
  negotiationId: string;
  status: string;
  endedBy: string;
  endedAt: string;
}

class PhoenixService {
  private socket: Socket | null = null;
  private negotiationChannel: Channel | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    const token = useAuthStore.getState().token;
    
    if (!token) {
      console.warn('No auth token available for Phoenix connection');
      return;
    }

    this.socket = new Socket(PHOENIX_URL, {
      params: { token },
      reconnectAfterMs: this.reconnectDelay as any,
    });

    this.socket.onOpen(() => {
      console.log('Phoenix socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.onError((error) => {
      console.error('Phoenix socket error:', error);
      this.handleReconnect();
    });

    this.socket.onClose(() => {
      console.log('Phoenix socket closed');
      this.handleReconnect();
    });

    this.socket.connect();
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  async joinNegotiationChannel(
    negotiationId: string,
    callbacks: {
      onPreviousMessages?: (messages: NegotiationMessage[]) => void;
      onNewMessage?: (message: NegotiationMessage) => void;
      onQueuedMessages?: (messages: NegotiationMessage[]) => void;
      onUserJoined?: (event: UserJoinedEvent) => void;
      onUserLeft?: (event: UserLeftEvent) => void;
      onTyping?: (event: TypingEvent) => void;
      onNegotiationEnded?: (event: NegotiationEndedEvent) => void;
      onError?: (error: string) => void;
    }
  ) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Leave existing channel if any
    if (this.negotiationChannel) {
      this.leaveNegotiationChannel();
    }

    this.negotiationChannel = this.socket.channel(`negotiation:${negotiationId}`);

    // Join events
    this.negotiationChannel.on('previous_messages', (payload) => {
      callbacks.onPreviousMessages?.(payload.messages);
    });

    this.negotiationChannel.on('queued_messages', (payload) => {
      callbacks.onQueuedMessages?.(payload.messages);
    });

    this.negotiationChannel.on('new_message', (payload) => {
      callbacks.onNewMessage?.(payload);
    });

    this.negotiationChannel.on('user_joined', (payload) => {
      callbacks.onUserJoined?.(payload);
    });

    this.negotiationChannel.on('user_left', (payload) => {
      callbacks.onUserLeft?.(payload);
    });

    this.negotiationChannel.on('typing', (payload) => {
      callbacks.onTyping?.(payload);
    });

    this.negotiationChannel.on('negotiation_ended', (payload) => {
      callbacks.onNegotiationEnded?.(payload);
    });

    // Error handling
    this.negotiationChannel.onError((reason: string) => {
      console.error('Negotiation channel error:', reason);
      callbacks.onError?.(reason);
    });

    // Join the channel
    return new Promise<boolean>((resolve) => {
      this.negotiationChannel
        .join()
        .receive('ok', () => {
          console.log(`Joined negotiation channel: ${negotiationId}`);
          resolve(true);
        })
        .receive('error', (reason) => {
          console.error('Failed to join negotiation channel:', reason);
          callbacks.onError?.(reason);
          resolve(false);
        })
        .receive('timeout', () => {
          console.error('Negotiation channel join timeout');
          callbacks.onError?.('Connection timeout');
          resolve(false);
        });
    });
  }

  leaveNegotiationChannel() {
    if (this.negotiationChannel) {
      this.negotiationChannel.leave();
      this.negotiationChannel = null;
      console.log('Left negotiation channel');
    }
  }

  sendMessage(content: string) {
    if (!this.negotiationChannel) {
      console.error('Not connected to negotiation channel');
      return false;
    }

    this.negotiationChannel.push('new_message', { content });
    return true;
  }

  sendTyping(typing: boolean) {
    if (!this.negotiationChannel) {
      console.error('Not connected to negotiation channel');
      return false;
    }

    this.negotiationChannel.push('typing', { typing });
    return true;
  }

  endNegotiation(status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') {
    if (!this.negotiationChannel) {
      console.error('Not connected to negotiation channel');
      return false;
    }

    this.negotiationChannel.push('end_negotiation', { status });
    return true;
  }

  isConnected(): boolean {
    return this.socket?.isConnected() || false;
  }

  isChannelJoined(): boolean {
    return this.negotiationChannel?.state === 'joined';
  }

  disconnect() {
    this.leaveNegotiationChannel();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Network status monitoring
  onNetworkOnline() {
    if (!this.isConnected()) {
      this.connect();
    }
  }

  onNetworkOffline() {
    console.log('Network offline - messages will be queued');
  }
}

// Singleton instance
export const phoenixService = new PhoenixService();

// Network event listeners
// if (typeof window !== 'undefined') {
//   window.addEventListener('online', () => phoenixService.onNetworkOnline());
//   window.addEventListener('offline', () => phoenixService.onNetworkOffline());
// }

export default phoenixService;
