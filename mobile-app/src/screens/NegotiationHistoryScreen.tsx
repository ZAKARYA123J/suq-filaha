import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { Negotiation } from '../store/negotiationStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiClient, getErrorMessage } from '../services/api';
import { RootStackParamList } from '../types/navigation'; // Import your types
type NegotiationHistoryNavigationProp = StackNavigationProp<RootStackParamList, 'NegotiationHistory'>;
export default function NegotiationHistoryScreen() {
  const navigation = useNavigation<NegotiationHistoryNavigationProp>();
    const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);

  const fetchNegotiations = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.getNegotiations();
      setNegotiations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setLoading(true);
      await fetchNegotiations();
      if (!mounted) return;
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [fetchNegotiations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNegotiations();
    setRefreshing(false);
  }, [fetchNegotiations]);

  const sortedNegotiations = useMemo(() => {
    return [...negotiations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [negotiations]);

  const renderItem = useCallback(
    ({ item }: { item: Negotiation }) => {
      const otherUser =
        user && item.buyerId === user.id ? item.farmer : item.buyer;

      const productName = item.product?.name || 'Product';
      const subtitle = `${item.status} · Original: $${item.originalPrice} · Proposed: $${item.proposedPrice}`;

      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('NegotiationChat', { negotiationId: item.id })}
        >
          {otherUser?.profileInfo ? (
            <Image source={{ uri: otherUser.profileInfo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {(otherUser?.name || 'N').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.name} numberOfLines={1}>
                {productName}
              </Text>
              <Text style={styles.time} numberOfLines={1}>
                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''}
              </Text>
            </View>

            <Text style={styles.preview} numberOfLines={2}>
              {otherUser?.name ? `${otherUser.name} · ${subtitle}` : subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, user]
  );

  const keyExtractor = useCallback((item: Negotiation) => item.id, []);

  const emptyText = useMemo(() => {
    if (loading) return '';
    if (error) return error;
    return 'No negotiations yet.';
  }, [error, loading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Negotiations</Text>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#489163" />
          </View>
        ) : (
          <FlatList
            data={sortedNegotiations}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.empty}>{emptyText}</Text>
              </View>
            }
            contentContainerStyle={sortedNegotiations.length === 0 ? styles.emptyContainer : undefined}
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
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  backButton: {
    paddingRight: 12,
  },
  backLabel: {
    fontSize: 28,
    color: '#489163',
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
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
