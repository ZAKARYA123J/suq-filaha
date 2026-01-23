import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaFrameContext,SafeAreaView } from 'react-native-safe-area-context';
import { useNegotiationStore, Negotiation } from '../store/negotiationStore';
import { useAuthStore } from '../store/authStore';
import { NegotiationMessage } from '../services/phoenix';

/* ================== TYPES ================== */

type NegotiationStackParamList = {
  NegotiationChat: { negotiationId: string };
};

type NegotiationChatRouteProp = RouteProp<NegotiationStackParamList, 'NegotiationChat'>;
type NegotiationChatNavigationProp = StackNavigationProp<NegotiationStackParamList, 'NegotiationChat'>;

interface Props {
  route: NegotiationChatRouteProp;
  navigation: NegotiationChatNavigationProp;
}


export default function NegotiationChatScreen({ route, navigation }: Props) {
  const { negotiationId } = route.params;
  const { user } = useAuthStore();

  const {
    currentNegotiation,
    messages,
    loading,
    connected,
    error,
    connectToNegotiation,
    disconnectFromNegotiation,
    sendMessage,
    sendTyping,
    endNegotiation,
    isTyping,
    onlineUsers,
    clearError,
  } = useNegotiationStore();

  const [text, setText] = useState('');
  const [showEndButtons, setShowEndButtons] = useState(false);
  const flatListRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  /* ---------- Resolve other user ---------- */
  const otherUser = useMemo(() => {
    if (!currentNegotiation || !user) return null;
    return user.id === currentNegotiation.buyerId
      ? currentNegotiation.farmer
      : currentNegotiation.buyer;
  }, [currentNegotiation, user]);

  const isOtherUserTyping = useMemo(() => {
    if (!otherUser) return false;
    return isTyping[otherUser.id] || false;
  }, [isTyping, otherUser]);

  const isOtherUserOnline = useMemo(() => {
    if (!otherUser) return false;
    return onlineUsers.includes(otherUser.id);
  }, [onlineUsers, otherUser]);

  /* ---------- Lifecycle ---------- */
  useEffect(() => {
    const initialize = async () => {
      clearError();
      const connected = await connectToNegotiation(negotiationId);
      if (!connected) {
        Alert.alert('Connection Error', 'Failed to connect to negotiation chat');
      }
    };

    initialize();

    return () => {
      disconnectFromNegotiation();
    };
  }, [negotiationId, clearError, connectToNegotiation, disconnectFromNegotiation]);

  useEffect(() => {
    if (error) {
      Alert.alert('Negotiation Error', error);
    }
  }, [error]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  /* ---------- Actions ---------- */
  const onSend = () => {
    if (!text.trim() || !user) return;

    const success = sendMessage(text.trim());
    if (success) {
      setText('');
    } else {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    
    // Send typing indicator
    sendTyping(value.length > 0);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1000);
  };

  const onEndNegotiation = (status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
    Alert.alert(
      'End Negotiation',
      `Are you sure you want to ${status.toLowerCase()} this negotiation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status,
          style: status === 'ACCEPTED' ? 'default' : 'destructive',
          onPress: () => {
            const success = endNegotiation(status);
            if (!success) {
              Alert.alert('Error', 'Failed to end negotiation');
            }
          },
        },
      ]
    );
  };

  /* ---------- Render ---------- */
  const renderMessage = ({ item }: { item: NegotiationMessage }) => {
    const isMine = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
          
          <View style={styles.messageMeta}>
            <Text style={styles.senderType}>
              {item.senderType === 'FARMER' ? '🌾 Farmer' : '🛒 Buyer'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNegotiationInfo = () => {
    if (!currentNegotiation) return null;

    return (
      <View style={styles.negotiationInfo}>
        <Text style={styles.productName}>
          {currentNegotiation.product?.name || 'Product'}
        </Text>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>
            Original: ${currentNegotiation.originalPrice}
          </Text>
          <Text style={styles.proposedPrice}>
            Proposed: ${currentNegotiation.proposedPrice}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.status,
            currentNegotiation.status === 'PENDING' && styles.pendingStatus,
            currentNegotiation.status === 'ACCEPTED' && styles.acceptedStatus,
            currentNegotiation.status === 'REJECTED' && styles.rejectedStatus,
          ]}>
            {currentNegotiation.status}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && !currentNegotiation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Loading negotiation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {otherUser?.profileInfo ? (
            <Image
              source={{ uri: otherUser.profileInfo }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {otherUser?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View>
            <Text style={styles.headerTitle}>
              {otherUser?.name ?? 'Negotiation'}
            </Text>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isOtherUserOnline
                      ? '#4CAF50'
                      : '#F44336',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {isOtherUserOnline ? 'Online' : 'Offline'}
                {isOtherUserTyping && ' - Typing...'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowEndButtons(!showEndButtons)}
        >
          <Text style={styles.moreButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {showEndButtons && currentNegotiation?.status === 'PENDING' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onEndNegotiation('ACCEPTED')}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onEndNegotiation('REJECTED')}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= NEGOTIATION INFO ================= */}
      {renderNegotiationInfo()}

      {/* ================= CHAT ================= */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

        {/* ================= INPUT ================= */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            multiline
            editable={connected && currentNegotiation?.status === 'PENDING'}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { 
                opacity: text.trim() && connected ? 1 : 0.5,
                backgroundColor: !connected || currentNegotiation?.status !== 'PENDING' ? '#CCC' : '#2196F3'
              },
            ]}
            onPress={onSend}
            disabled={!text.trim() || !connected || currentNegotiation?.status !== 'PENDING'}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarLetter: { color: '#FFF', fontSize: 18, fontWeight: '600' },

  headerTitle: { fontSize: 18, fontWeight: '600', color: '#212121' },

  connectionStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: { fontSize: 12, color: '#616161' },

  moreButton: { padding: 8 },

  moreButtonText: { fontSize: 20, color: '#666' },

  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  acceptButton: { backgroundColor: '#4CAF50' },

  rejectButton: { backgroundColor: '#F44336' },

  acceptButtonText: { color: '#FFF', fontWeight: '600' },

  rejectButtonText: { color: '#FFF', fontWeight: '600' },

  negotiationInfo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  productName: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 8 },

  priceInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },

  priceLabel: { fontSize: 14, color: '#666' },

  proposedPrice: { fontSize: 14, color: '#2196F3', fontWeight: '600' },

  statusContainer: { alignItems: 'flex-start' },

  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  pendingStatus: { backgroundColor: '#FFC107', color: '#FFF' },

  acceptedStatus: { backgroundColor: '#4CAF50', color: '#FFF' },

  rejectedStatus: { backgroundColor: '#F44336', color: '#FFF' },

  chatContainer: { flex: 1 },

  messageContainer: {
    marginHorizontal: 12,
    marginVertical: 4,
  },

  myMessageContainer: { alignItems: 'flex-end' },

  otherMessageContainer: { alignItems: 'flex-start' },

  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },

  myBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },

  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  messageText: { fontSize: 15, color: '#212121', marginBottom: 4 },

  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  senderType: { fontSize: 10, color: '#666', fontStyle: 'italic' },

  timestamp: { fontSize: 10, color: '#999' },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8,
  },

  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  sendLabel: { color: '#FFF', fontWeight: '600' },
});
