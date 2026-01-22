import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Switch,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';
import { apiClient, getErrorMessage } from '../services/api';
import { Product } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface ProductsScreenProps {
  navigation: any;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ProductFilter) => void;
  currentFilters: ProductFilter;
}

interface ProductFilter {
  category?: string;
  search?: string;
  farmerId?: string;
  isAvailable?: boolean;
}

// Mock data for categories and farmers (replace with API calls)
const CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Meat',
  'Grains',
  'Herbs',
  'Organic',
];

const FARMERS = [
  { id: '1', name: 'Green Valley Farm' },
  { id: '2', name: 'Sunshine Organic' },
  { id: '3', name: 'Mountain Fresh' },
  { id: '4', name: 'River Side Farm' },
];

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(
    currentFilters.category || 'All'
  );
  const [selectedFarmer, setSelectedFarmer] = useState(
    currentFilters.farmerId || ''
  );
  const [availability, setAvailability] = useState(
    currentFilters.isAvailable ?? true
  );

  const handleApply = () => {
    const filters: ProductFilter = {
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      farmerId: selectedFarmer || undefined,
      isAvailable: availability,
    };
    onApply(filters);
  };

  const handleReset = () => {
    setSelectedCategory('All');
    setSelectedFarmer('');
    setAvailability(true);
    onApply({});
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Products</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Farmer Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Farmer</Text>
            <View style={styles.farmerContainer}>
              {FARMERS.map((farmer) => (
                <TouchableOpacity
                  key={farmer.id}
                  style={[
                    styles.farmerOption,
                    selectedFarmer === farmer.id && styles.farmerOptionActive,
                  ]}
                  onPress={() =>
                    setSelectedFarmer(
                      selectedFarmer === farmer.id ? '' : farmer.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.farmerText,
                      selectedFarmer === farmer.id && styles.farmerTextActive,
                    ]}
                  >
                    {farmer.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability Filter */}
          <View style={styles.filterSection}>
            <View style={styles.availabilityRow}>
              <Text style={styles.filterLabel}>Available Only</Text>
              <Switch
                value={availability}
                onValueChange={setAvailability}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={availability ? '#489163' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ProductFilter>({});
  const [filterCount, setFilterCount] = useState(0);
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeFilters]);

  useEffect(() => {
    // Update filter count badge
    let count = 0;
    if (activeFilters.category) count++;
    if (activeFilters.farmerId) count++;
    if (activeFilters.isAvailable !== undefined) count++;
    if (activeFilters.search) count++;
    setFilterCount(count);
  }, [activeFilters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: ProductFilter = {
        ...activeFilters,
        search: searchQuery || undefined,
      };
      const response = await apiClient.getProducts(params);
      setProducts(response);
    } catch (error) {
      console.error('Error fetching products:', getErrorMessage(error));
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Debounce search - wait for user to stop typing
    const timer = setTimeout(() => {
      setActiveFilters((prev) => ({
        ...prev,
        search: text.trim() || undefined,
      }));
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    Alert.alert('Success', `${product.name} added to cart!`);
  };

  const handleNavigateToDetails = (product: Product) => {
    navigation.navigate('ProductDetail', { id: product.id });
  };

  const handleApplyFilters = (filters: ProductFilter) => {
    setActiveFilters(filters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.productCard, { width: CARD_WIDTH }]}
      onPress={() => handleNavigateToDetails(item)}
    >
      {/* Product Image with Availability Badge */}
      <View>
        <Image
          source={{ uri: item.images[0] || 'https://via.placeholder.com/300' }}
          style={styles.productImage}
        />
        {!item.isAvailable && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Top Badge */}
      <View style={styles.productBadge}>
        <Text style={styles.badgeTxt}>{item.category.toUpperCase()}</Text>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.farmerName}>By {item.farmerName}</Text>
        <Text style={styles.productPrice}>
          {item.price} SAR / {item.unit}
        </Text>

        {/* Buttons Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => handleNavigateToDetails(item)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addButton,
              !item.isAvailable && styles.addButtonDisabled,
            ]}
            onPress={() => handleAddToCart(item)}
            disabled={!item.isAvailable}
          >
            <Text style={styles.addButtonText}>
              {item.isAvailable ? 'Message Seller' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#489163" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Farm Fresh Products</Text>
          <Text style={styles.subtitle}>Direct from local farmers</Text>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterIcon}>⚙</Text>
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {filterCount > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activeFiltersScroll}
            >
              {activeFilters.category && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    Category: {activeFilters.category}
                  </Text>
                </View>
              )}
              {activeFilters.farmerId && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    Farmer: {FARMERS.find(f => f.id === activeFilters.farmerId)?.name}
                  </Text>
                </View>
              )}
              {activeFilters.isAvailable !== undefined && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>Available Only</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Products Count */}
        <Text style={styles.resultsCount}>
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </Text>

        {/* Products List */}
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters or search term
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.emptyButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchProducts}
        />
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 20,
    color: '#666',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    marginBottom: 12,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
  },
  activeFilterChip: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    color: '#2d5016',
    fontSize: 14,
  },
  clearFiltersButton: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'center',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#2d5016',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  productInfo: {
    padding: 14,
  },
  productName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  farmerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#489163',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5a7c47',
  },
  detailsButtonText: {
    color: '#5a7c47',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#5a7c47',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a6c37',
  },
  addButtonDisabled: {
    backgroundColor: '#cccccc',
    borderColor: '#bbbbbb',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#5a7c47',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2d5016',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  farmerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  farmerOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  farmerOptionActive: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2d5016',
  },
  farmerText: {
    color: '#666',
    fontSize: 14,
  },
  farmerTextActive: {
    color: '#2d5016',
    fontWeight: '600',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2d5016',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductsScreen;