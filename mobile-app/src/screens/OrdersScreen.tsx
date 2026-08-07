// screens/OrdersScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOrderStore } from '../store/orderStore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Order } from '../store/orderStore';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Status color mapping
const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'PENDING': return '#FFA500'; // Orange
    case 'CONFIRMED': return '#2196F3'; // Blue
    case 'SHIPPED': return '#9C27B0'; // Purple
    case 'DELIVERED': return '#4CAF50'; // Green
    case 'CANCELLED': return '#F44336'; // Red
    default: return '#757575'; // Gray
  }
};

export default function OrdersScreen() {
  const { orders, fetchOrdersFromApi, loading, error } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Load orders on screen focus
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    await fetchOrdersFromApi();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrdersFromApi();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    Alert.alert(
      `Order #${order.id.slice(-8)}`,
      `Status: ${order.status}\nTotal: ₹${order.totalAmount}\nDate: ${new Date(order.createdAt).toLocaleDateString()}\nAddress: ${order.deliveryAddress || 'Not specified'}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleOrderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(-8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.totalAmount}>{item.totalAmount.toFixed(2)} MAD</Text>
        <Text style={styles.itemCount}>
          {item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          Ordered: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {/* {item.deliveryDate && (
          <Text style={styles.deliveryDate}>
            Delivery: {new Date(item.deliveryDate).toLocaleDateString()}
          </Text>
        )} */}
      </View>
      
      {item.deliveryAddress && (
        <Text style={styles.address} numberOfLines={1}>
          📍 {item.deliveryAddress}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#489163" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('NegotiationHistory')}
          >
            <Text style={styles.negotiationIcon}>💬</Text>
            <Text style={styles.headerActionText}>Negotiations</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#489163']}
            tintColor="#489163"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              Your orders will appear here once you make a purchase
            </Text>
          </View>
        }
        ListFooterComponent={
          orders.length > 0 ? (
            <Text style={styles.footerText}>
              Pull down to refresh orders
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#489163',
    borderRadius: 20,
    gap: 6,
  },
  negotiationIcon: {
    fontSize: 16,
  },
  headerActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  deliveryDate: {
    fontSize: 13,
    color: '#489163',
    marginTop: 2,
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#489163',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
});