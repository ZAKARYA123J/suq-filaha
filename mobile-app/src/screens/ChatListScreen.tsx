import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '@rneui/themed';

import { useAuthStore } from '../store/authStore';
import { ChatListItem, useChatStore } from '../store/chatStore';

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { loadChats } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [search, setSearch] = useState(''); 

  const fetchChats = useCallback(async () => {
    try {
      setError(null);
      const data = await loadChats();
      setChats(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load chats');
    }
  }, [loadChats]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setLoading(true);
      await fetchChats();
      if (!mounted) return;
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, [fetchChats]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    return chats.filter(chat => {
      const otherUser = user && chat.user1Id === user.id ? chat.user2 : chat.user1;
      return otherUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
             chat.lastMessage?.toLowerCase().includes(search.toLowerCase());
    });
  }, [chats, search, user]);

  const renderItem = useCallback(
    ({ item }: { item: ChatListItem }) => {
      const otherUser =
        user && item.user1Id === user.id ? item.user2 : item.user1;

      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Chat', { chatId: item.id })}
        >
          {otherUser?.profileInfo ? (
            <Image source={{ uri: otherUser.profileInfo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {(otherUser?.name || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.name} numberOfLines={1}>
                {otherUser?.name || 'Chat'}
              </Text>
              <Text style={styles.time} numberOfLines={1}>
                {item.lastMessageTime
                  ? new Date(item.lastMessageTime).toLocaleDateString()
                  : ''}
              </Text>
            </View>

            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, user]
  );

  const keyExtractor = useCallback((item: ChatListItem) => item.id, []);

  const emptyText = useMemo(() => {
    if (loading) return '';
    if (error) return error;
    return 'No chats yet.';
  }, [error, loading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>

        {/* <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('NegotiationHistory')}
        >
          <Text style={styles.headerActionText}>Negotiations</Text>
        </TouchableOpacity> */}
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search buyers and farmers"
        value={search}
        onChangeText={setSearch}
        platform={Platform.OS === 'ios' ? 'ios' : 'android'}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        inputStyle={styles.searchInput}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Unread</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#489163" />
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.empty}>{emptyText}</Text>
              </View>
            }
            contentContainerStyle={filteredChats.length === 0 ? styles.emptyContainer : undefined}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#212121',
  },
  headerAction: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#489163',
    borderRadius: 16,
  },
  headerActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    backgroundColor: '#F5F5F5',
    height: 40,
  },
  searchInput: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    marginRight: 24,
    paddingBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#489163',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#489163',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    color: '#616161',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    paddingRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#757575',
  },
  preview: {
    marginTop: 4,
    fontSize: 13,
    color: '#616161',
  },
});