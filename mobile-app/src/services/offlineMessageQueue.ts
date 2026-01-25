import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_MESSAGES_KEY = 'offline_negotiation_messages';
const QUEUED_MESSAGES_KEY = 'queued_negotiation_messages';

export interface OfflineMessage {
  id: string;
  negotiationId: string;
  content: string;
  senderId: string;
  senderType: 'FARMER' | 'BUYER';
  createdAt: string;
  timestamp: number; // For ordering and cleanup
}

export interface QueuedMessage {
  id: string;
  negotiationId: string;
  content: string;
  senderId: string;
  senderType: 'FARMER' | 'BUYER';
  createdAt: string;
  queuedAt: string;
}

class OfflineMessageQueue {
  private static instance: OfflineMessageQueue;
  private offlineMessages: OfflineMessage[] = [];
  private queuedMessages: Map<string, QueuedMessage[]> = new Map();
  private listeners: ((messages: QueuedMessage[]) => void)[] = [];

  private constructor() {
    this.loadOfflineMessages();
    this.loadQueuedMessages();
  }

  static getInstance(): OfflineMessageQueue {
    if (!OfflineMessageQueue.instance) {
      OfflineMessageQueue.instance = new OfflineMessageQueue();
    }
    return OfflineMessageQueue.instance;
  }

  async loadOfflineMessages() {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_MESSAGES_KEY);
      if (stored) {
        this.offlineMessages = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline messages:', error);
      this.offlineMessages = [];
    }
  }

  async saveOfflineMessages() {
    try {
      await AsyncStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(this.offlineMessages));
    } catch (error) {
      console.error('Failed to save offline messages:', error);
    }
  }

  async addOfflineMessage(message: OfflineMessage) {
    this.offlineMessages.push(message);
    await this.saveOfflineMessages();
  }

  getOfflineMessages(negotiationId: string): OfflineMessage[] {
    return this.offlineMessages.filter(msg => msg.negotiationId === negotiationId);
  }

  async clearOfflineMessages(negotiationId?: string) {
    if (negotiationId) {
      this.offlineMessages = this.offlineMessages.filter(msg => msg.negotiationId !== negotiationId);
    } else {
      this.offlineMessages = [];
    }
    await this.saveOfflineMessages();
  }

  async loadQueuedMessages() {
    try {
      const stored = await AsyncStorage.getItem(QUEUED_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queuedMessages = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load queued messages:', error);
      this.queuedMessages = new Map();
    }
  }

  async saveQueuedMessages() {
    try {
      const obj = Object.fromEntries(this.queuedMessages);
      await AsyncStorage.setItem(QUEUED_MESSAGES_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save queued messages:', error);
    }
  }

  async queueMessage(message: QueuedMessage) {
    const negotiationId = message.negotiationId;
    const existing = this.queuedMessages.get(negotiationId) || [];
    
    const alreadyQueued = existing.some(msg => msg.id === message.id);
    if (!alreadyQueued) {
      const updated = [...existing, message];
      this.queuedMessages.set(negotiationId, updated);
      await this.saveQueuedMessages();
      
      console.log(`Message queued for negotiation ${negotiationId}:`, message);
    }
  }

  getQueuedMessages(negotiationId: string): QueuedMessage[] {
    return this.queuedMessages.get(negotiationId) || [];
  }

  async markMessagesAsDelivered(negotiationId: string, messageIds: string[]) {
    const existing = this.queuedMessages.get(negotiationId) || [];
    const updated = existing.filter(msg => !messageIds.includes(msg.id));
    
    if (updated.length !== existing.length) {
      this.queuedMessages.set(negotiationId, updated);
      await this.saveQueuedMessages();
      console.log(`Marked ${messageIds.length} messages as delivered for negotiation ${negotiationId}`);
    }
  }

  async clearQueuedMessages(negotiationId?: string) {
    if (negotiationId) {
      this.queuedMessages.delete(negotiationId);
    } else {
      this.queuedMessages.clear();
    }
    await this.saveQueuedMessages();
  }

  addListener(listener: (messages: QueuedMessage[]) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (messages: QueuedMessage[]) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // private notifyListeners(negotiationId: string, messages: QueuedMessage[]) {
  //   this.listeners.forEach(listener => listener(messages));
  // }

  async cleanupOldMessages() {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    const originalLength = this.offlineMessages.length;
    this.offlineMessages = this.offlineMessages.filter(msg => msg.timestamp > sevenDaysAgo);
    
    if (this.offlineMessages.length !== originalLength) {
      await this.saveOfflineMessages();
      console.log(`Cleaned up ${originalLength - this.offlineMessages.length} old offline messages`);
    }

    let queuedCleaned = 0;
    for (const [negotiationId, messages] of this.queuedMessages.entries()) {
      const filtered = messages.filter(msg => 
        new Date(msg.queuedAt).getTime() > sevenDaysAgo
      );
      
      if (filtered.length !== messages.length) {
        this.queuedMessages.set(negotiationId, filtered);
        queuedCleaned += messages.length - filtered.length;
      }
    }

    if (queuedCleaned > 0) {
      await this.saveQueuedMessages();
      console.log(`Cleaned up ${queuedCleaned} old queued messages`);
    }
  }

  isOnline(): boolean {
    return true;
  }

  // async syncWhenOnline() {
  //   // This should be called when the app comes back online
  //   // Messages will be sent via the Phoenix service reconnection logic
  //   console.log('Syncing queued messages when online...');
  // }
}

export const offlineMessageQueue = OfflineMessageQueue.getInstance();

setTimeout(() => {
  offlineMessageQueue.cleanupOldMessages();
}, 5000); // Cleanup 5 seconds after app start

setInterval(() => {
  offlineMessageQueue.cleanupOldMessages();
}, 24 * 60 * 60 * 1000);
