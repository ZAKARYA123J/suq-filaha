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
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useNegotiationStore } from '../store/negotiationStore';
import { useAuthStore } from '../store/authStore';
import { NegotiationMessage } from '../services/phoenix';

type NegotiationStackParamList = {
  NegotiationChat: { negotiationId: string };
};

type NegotiationChatRouteProp = RouteProp<
  NegotiationStackParamList,
  'NegotiationChat'
>;
type NegotiationChatNavigationProp = StackNavigationProp<
  NegotiationStackParamList,
  'NegotiationChat'
>;

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
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  /* ---------- Helpers ---------- */
  const isNegotiationClosed =
    currentNegotiation?.status === 'ACCEPTED' ||
    currentNegotiation?.status === 'REJECTED' ||
    currentNegotiation?.status === 'CANCELLED';

  const otherUser = useMemo(() => {
    if (!currentNegotiation || !user) return null;
    return user.id === currentNegotiation.buyerId
      ? currentNegotiation.farmer
      : currentNegotiation.buyer;
  }, [currentNegotiation, user]);

  const isOtherUserTyping = useMemo(
    () => (otherUser ? isTyping[otherUser.id] || false : false),
    [isTyping, otherUser]
  );

  const isOtherUserOnline = useMemo(
    () => (otherUser ? onlineUsers.includes(otherUser.id) : false),
    [onlineUsers, otherUser]
  );

  /* ---------- Lifecycle ---------- */
  useEffect(() => {
    const init = async () => {
      clearError();
      const ok = await connectToNegotiation(negotiationId);
      if (!ok) {
        Alert.alert('Connection Error', 'Failed to connect');
      }
    };
    init();
    return () => disconnectFromNegotiation();
  }, [negotiationId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Negotiation Error', error);
    }
  }, [error]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  /* ---------- Actions ---------- */
  const onSend = () => {
    if (!text.trim() || !user || isNegotiationClosed) return;
    sendMessage(text.trim());
    setText('');
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (isNegotiationClosed) return;

    sendTyping(value.length > 0);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1000);
  };

  const onEndNegotiation = (
    status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  ) => {
    Alert.alert(
      'End Negotiation',
      `Are you sure you want to ${status.toLowerCase()} this negotiation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status,
          style: 'destructive',
          onPress: () => endNegotiation(status),
        },
      ]
    );
  };

  /* ---------- Render Message ---------- */
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
            <Text style={styles.senderType}>{item.senderType}</Text>
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

  if (loading && !currentNegotiation) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.center}>
          <Text>Loading negotiation...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>

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

              <Text
                style={[
                  styles.statusText,
                  currentNegotiation?.status === 'PENDING' &&
                    styles.pendingStatus,
                  currentNegotiation?.status === 'ACCEPTED' &&
                    styles.acceptedStatus,
                  currentNegotiation?.status === 'REJECTED' &&
                    styles.rejectedStatus,
                  currentNegotiation?.status === 'CANCELLED' &&
                    styles.cancelledStatus,
                ]}
              >
                {currentNegotiation?.status}
                {isOtherUserTyping && ' • Typing...'}
              </Text>
            </View>
          </View>

          {currentNegotiation?.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowEndButtons(!showEndButtons)}
            >
              <Text style={styles.moreButtonText}>⋮</Text>
            </TouchableOpacity>
          )}
        </View>

        {showEndButtons && currentNegotiation?.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onEndNegotiation('ACCEPTED')}
            >
              <Text style={styles.actionText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onEndNegotiation('REJECTED')}
            >
              <Text style={styles.actionText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= CHAT ================= */}
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingVertical: 8,
              flexGrow: messages.length === 0 ? 1 : undefined,
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>No messages yet</Text>
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
              editable={connected && !isNegotiationClosed}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { opacity: text.trim() && connected && !isNegotiationClosed ? 1 : 0.5 },
              ]}
              onPress={onSend}
              disabled={!text.trim() || !connected || isNegotiationClosed}
            >
              <Text style={styles.sendLabel}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  backButton: { marginRight: 6 },
  backButtonText: { fontSize: 28, color: '#212121' },

  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9E9E9E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: { color: '#FFF', fontSize: 18, fontWeight: '600' },

  headerTitle: { fontSize: 16, fontWeight: '600' },

  statusText: { fontSize: 12, marginTop: 2 },

  pendingStatus: { color: '#FFC107' },
  acceptedStatus: { color: '#4CAF50', fontWeight: '600' },
  rejectedStatus: { color: '#F44336', fontWeight: '600' },
  cancelledStatus: { color: '#F44336', fontWeight: '600' },

  moreButton: { padding: 6 },
  moreButtonText: { fontSize: 20 },

  actionButtons: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFF',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#F44336' },
  actionText: { color: '#FFF', fontWeight: '600' },

  chatContainer: { flex: 1 },

  messageContainer: { marginHorizontal: 12, marginVertical: 4 },
  myMessageContainer: { alignItems: 'flex-end' },
  otherMessageContainer: { alignItems: 'flex-start' },

  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: '#DCF8C6' },
  otherBubble: { backgroundColor: '#FFF', elevation: 2 },

  messageText: { fontSize: 15, marginBottom: 4 },
  messageMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  senderType: { fontSize: 10, color: '#666' },
  timestamp: { fontSize: 10, color: '#999' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  inputRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendLabel: { color: '#FFF', fontWeight: '600' },
});
