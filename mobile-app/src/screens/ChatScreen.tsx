import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChatStore } from '.././store/chatStore';
import { useAuthStore } from '../store/authStore';

export default function ChatScreen() {
  const { user } = useAuthStore();
  const { messages, sendMessage, loadMessages, loading } = useChatStore();

  const [text, setText] = useState('');

  useEffect(() => {
    loadMessages(); // first load
  }, []);

  const onSend = () => {
    if (!text.trim()) return;
    sendMessage({
      id: Date.now().toString(),
      text: text.trim(),
      senderId: user!.id,
      timestamp: new Date().toISOString(),
    });
    setText('');
  };

  const renderItem = ({ item }: { item: any })  => (
    <View
      style={[
        styles.bubble,
        item.senderId === user?.id ? styles.myBubble : styles.otherBubble,
      ]}
    >
      <Text style={styles.msgText}>{item.text}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading chats…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
            <Text style={styles.sendLabel}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubble: {
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '75%',
  },
  myBubble: { backgroundColor: '#489163', alignSelf: 'flex-end' },
  otherBubble: { backgroundColor: '#e5e5ea', alignSelf: 'flex-start' },
  msgText: { fontSize: 15, color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#489163',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendLabel: { color: '#fff', fontWeight: '600' },
});