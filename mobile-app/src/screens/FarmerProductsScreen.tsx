import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useFarmerProductStore } from '../store/farmerProductStore';
import { Product } from '../types';
import { Card, Button, Switch } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';

type FarmerProductsScreenNavigationProp =
  StackNavigationProp<RootStackParamList, 'FarmerProducts'>;

interface FarmerProductsScreenProps {
  navigation: FarmerProductsScreenNavigationProp;
}

const FarmerProductsScreen: React.FC<FarmerProductsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const {
    products,
    loading,
    fetchMyProducts,
    toggleProductAvailability,
    deleteProduct,
  } = useFarmerProductStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState<boolean | undefined>(undefined);

  const loadProducts = useCallback(async () => {
    await fetchMyProducts(filterAvailable);
  }, [filterAvailable, fetchMyProducts]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const handleToggleAvailability = async (product: Product) => {
    try {
      await toggleProductAvailability(product.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update product availability');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: Product) => {
    navigation.navigate('AddEditProduct', { product });
  };

 const handleAddProduct = () => {
    navigation.navigate('AddEditProduct' as any) ;
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <Card containerStyle={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>
            ${item.price} per {item.unit}
          </Text>
          <Text style={styles.productQuantity}>
            Quantity: {item.quantity} {item.unit}
          </Text>
        </View>

        {item.images?.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        )}
      </View>

      <View style={styles.productActions}>
        <View style={styles.availabilityToggle}>
          <Text style={styles.availabilityText}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
          <Switch
            value={item.isAvailable}
            onValueChange={() => handleToggleAvailability(item)}
            color="#4CAF50"
          />
        </View>

        <View style={styles.actionButtons}>
          <Button
            type="clear"
            icon={<Icon name="edit" size={20} color="#2196F3" />}
            onPress={() => handleEditProduct(item)}
          />
          <Button
            type="clear"
            icon={<Icon name="delete" size={20} color="#F44336" />}
            onPress={() => handleDeleteProduct(item)}
          />
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inventory" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        {filterAvailable === true
          ? "You don't have any available products."
          : filterAvailable === false
          ? "You don't have any unavailable products."
          : "You haven't added any products yet."}
      </Text>
      <Button
        title="Add Your First Product"
        onPress={handleAddProduct}
        buttonStyle={styles.addButton}
      />
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {[
        { label: 'All', value: undefined },
        { label: 'Available', value: true },
        { label: 'Unavailable', value: false },
      ].map((f) => (
        <TouchableOpacity
          key={f.label}
          style={[
            styles.filterButton,
            filterAvailable === f.value && styles.filterButtonActive,
          ]}
          onPress={() => setFilterAvailable(f.value)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterAvailable === f.value && styles.filterButtonTextActive,
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your products...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderFilterButtons()}

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          products.length === 0 ? styles.emptyListContainer : styles.listContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={handleAddProduct}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: '#4CAF50' },
  filterButtonText: { color: '#666', fontWeight: '500' },
  filterButtonTextActive: { color: '#fff' },

  listContainer: { paddingVertical: 8 },
  emptyListContainer: { flex: 1 },

  productCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  productHeader: { flexDirection: 'row', marginBottom: 12 },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 18, fontWeight: '600' },
  productCategory: { color: '#666' },
  productPrice: { color: '#4CAF50', fontWeight: '600' },
  productQuantity: { color: '#666' },
  productImage: { width: 80, height: 80, borderRadius: 8 },

  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityToggle: { flexDirection: 'row', alignItems: 'center' },
  availabilityText: { marginRight: 8 },
actionButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},

  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#666', textAlign: 'center', marginVertical: 12 },
  addButton: { backgroundColor: '#4CAF50', borderRadius: 8 },

  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default FarmerProductsScreen;
