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
  Pressable,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useChatStore, Message } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

/* ================== TYPES ================== */

type ChatStackParamList = {
  Chat: { chatId: string };
};

type ChatScreenRouteProp = RouteProp<ChatStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<
  ChatStackParamList,
  'Chat'
>;

interface Props {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
}

/* ================== COMPONENT ================== */

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId } = route.params;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const {
    messages,
    loading,
    connected,
    error,
    loadMessages,
    sendMessage,
    connectToChat,
    disconnectFromChat,
    chatRoom,
  } = useChatStore();

  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  /* ---------- Resolve other user ---------- */
  const otherUser = useMemo(() => {
    if (!chatRoom || !user) return null;
    return chatRoom.user1Id === user.id
      ? chatRoom.user2
      : chatRoom.user1;
  }, [chatRoom, user]);

  /* ---------- Lifecycle ---------- */
  useEffect(() => {
    connectToChat(chatId);
    loadMessages(chatId);

    return () => {
      disconnectFromChat();
    };
  }, [chatId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Chat Error', error);
    }
  }, [error]);

  /* ---------- Actions ---------- */
  const onSend = () => {
    if (!text.trim() || !user) return;

    sendMessage({
      text: text.trim(),
      senderId: user.id,
    });

    setText('');
  };

  /* ---------- Render message ---------- */
  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.bubble,
          isMine ? styles.myBubble : styles.otherBubble,
        ]}
      >
        <Text style={styles.msgText}>{item.text}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          {isMine && (
            <Text style={styles.readStatus}>
              {item.isRead ? 'Read' : 'Sent'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  /* ---------- Loading ---------- */
  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading messages…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>

        <View style={styles.headerContent}>
          {otherUser?.profileInfo ? (
            <Image
              source={{ uri: otherUser.profileInfo }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}

          <View>
            <Text style={styles.headerTitle}>
              {otherUser?.name ?? 'Chat'}
            </Text>

            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: connected
                      ? '#4CAF50'
                      : '#F44336',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {connected ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= CHAT ================= */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToOffset({
              offset: 0,
              animated: false,
            })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>No messages yet.</Text>
            </View>
          }
        />

        {/* ================= INPUT ================= */}
        <View
          style={[
            styles.inputRow,
            { paddingBottom: insets.bottom || 8 },
          ]}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { opacity: text.trim() ? 1 : 0.5 },
            ]}
            onPress={onSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  backButton: {
    paddingRight: 12,
  },

  backLabel: {
    fontSize: 28,
    color: '#2196F3',
    lineHeight: 28,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarLetter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },

  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    color: '#616161',
  },

  bubble: {
    maxWidth: '80%',
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
  },

  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },

  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },

  msgText: {
    fontSize: 15,
    color: '#212121',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  timestamp: {
    fontSize: 10,
    color: '#757575',
    marginRight: 6,
  },

  readStatus: {
    fontSize: 10,
    color: '#4CAF50',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
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
    color: '#212121',
  },

  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  sendLabel: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ChatScreen;
