import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useOrderStore } from '.././store/orderStore';
import { Order } from '../types';
export default function OrdersScreen() {
  const { orders, fetchOrders, loading } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.title}>Order #{item.id.slice(-6)}</Text>
      <Text style={styles.status}>{item.status}</Text>
      <Text style={styles.total}>₹{item.totalAmount}</Text>
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading orders…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders as any} 
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: { fontSize: 16, fontWeight: '600' },
  status: { marginTop: 4, color: '#489163' },
  total: { marginTop: 4, fontWeight: '500' },
  date: { marginTop: 4, fontSize: 12, color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});