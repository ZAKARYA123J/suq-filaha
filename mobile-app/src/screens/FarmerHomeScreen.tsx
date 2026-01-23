import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { ComponentType } from 'react';
import { Card, Button } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// import { StackNavigationProp } from '@react-navigation/stack';
// import { RouteProp } from '@react-navigation/native';
// import { RootStackParamList } from '../types/navigation';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { useFarmerProductStore } from '../store/farmerProductStore';

const { width } = Dimensions.get('window');


type TabParamList = {
  FarmerHomeTab: undefined;
  FarmerProductsTab: { filter?: string };
  OrdersTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'FarmerHomeTab'>;

// Remove the interface definitions for navigation and route props
// as they come from BottomTabScreenProps

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  onPress?: () => void;
}
const AnalyticsCard: ComponentType<AnalyticsCardProps> = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Card containerStyle={[styles.analyticsCard, { borderLeftColor: color }]}>
      <View style={styles.analyticsContent}>
        <Icon name={icon} color={color} size={24} />
        <View style={styles.analyticsText}>
          <Text style={styles.analyticsTitle}>{title}</Text>
          <Text style={[styles.analyticsValue, { color }]}>{value}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

const FarmerHomeScreen = ({ navigation }: Props) => {
    const { user } = useAuthStore();
  const { products, loading, fetchMyProducts } = useFarmerProductStore();

  // Calculate analytics
  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.isAvailable).length;
  const unavailableProducts = totalProducts - availableProducts;
  const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;

  const loadAnalytics = useCallback(async () => {
    await fetchMyProducts();
  }, [fetchMyProducts]);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  // Remove onRefresh as it's not used in this screen

const handleQuickAction = (action: string) => {
  switch (action) {
    case 'addProduct':
      navigation.navigate('AddEditProduct'); // This won't work either - see below
      break;
    case 'viewProducts':
      navigation.navigate('FarmerProductsTab'); // ✅ Changed from 'FarmerProducts'
      break;
    case 'available':
      navigation.navigate('FarmerProductsTab', { filter: 'available' }); // ✅ Changed
      break;
    case 'unavailable':
      navigation.navigate('FarmerProductsTab', { filter: 'unavailable' }); // ✅ Changed
      break;
  }
};

  const recentProducts = products.slice(0, 3);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back, {user?.name || 'Farmer'}! 👋</Text>
        <Text style={styles.welcomeSubtitle}>Here's your farm overview</Text>
      </View>

      {/* Analytics Cards */}
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>Farm Analytics</Text>
        <View style={styles.analyticsGrid}>
          <AnalyticsCard
            title="Total Products"
            value={totalProducts}
            icon="inventory"
            color="#2196F3"
            onPress={() => handleQuickAction('viewProducts')}
          />
          <AnalyticsCard
            title="Available"
            value={availableProducts}
            icon="check-circle"
            color="#4CAF50"
            onPress={() => handleQuickAction('available')}
          />
          <AnalyticsCard
            title="Unavailable"
            value={unavailableProducts}
            icon="cancel"
            color="#F44336"
            onPress={() => handleQuickAction('unavailable')}
          />
          <AnalyticsCard
            title="Avg Price"
            value={`$${averagePrice.toFixed(2)}`}
            icon="attach-money"
            color="#FF9800"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.addProductButton]}
            onPress={() => handleQuickAction('addProduct')}
          >
            <Icon name="add-circle" color="#fff" size={32} />
            <Text style={styles.quickActionText}>Add Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, styles.viewProductsButton]}
            onPress={() => handleQuickAction('viewProducts')}
          >
            <Icon name="visibility" color="#fff" size={32} />
            <Text style={styles.quickActionText}>View Products</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <View style={styles.recentProductsSection}>
          <Text style={styles.sectionTitle}>Recent Products</Text>
          {recentProducts.map((product) => (
            <Card key={product.id} containerStyle={styles.productCard}>
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>
                    ${product.price} per {product.unit} • {product.quantity} {product.unit}
                  </Text>
                </View>
                <View style={[styles.statusBadge, product.isAvailable ? styles.availableBadge : styles.unavailableBadge]}>
                  <Text style={[styles.statusText, product.isAvailable ? styles.availableText : styles.unavailableText]}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Empty State */}
      {totalProducts === 0 && (
        <View style={styles.emptySection}>
          <Icon name="eco" size={64} color="#4CAF50" />
          <Text style={styles.emptyTitle}>Start Your Farm Journey</Text>
          <Text style={styles.emptySubtitle}>Add your first product to get started</Text>
          <Button
            title="Add Your First Product"
            onPress={() => handleQuickAction('addProduct')}
            buttonStyle={styles.addFirstProductButton}
            titleStyle={styles.addFirstProductText}
          />
        </View>
      )}
    </ScrollView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcomeSection: {
    paddingTop:50,
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  analyticsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    width: (width - 48) / 2 - 8,
    marginBottom: 12,
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsText: {
    marginLeft: 12,
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    padding: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addProductButton: {
    backgroundColor: '#4CAF50',
  },
  viewProductsButton: {
    backgroundColor: '#2196F3',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  recentProductsSection: {
    padding: 16,
  },
  productCard: {
    marginBottom: 8,
    marginHorizontal: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availableBadge: {
    backgroundColor: '#E8F5E8',
  },
  unavailableBadge: {
    backgroundColor: '#FFE8E8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#F44336',
  },
  emptySection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstProductButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstProductText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FarmerHomeScreen;