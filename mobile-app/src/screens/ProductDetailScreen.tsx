import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { apiClient } from '../services/api';
import { useNavigation } from '@react-navigation/native';
const { width, height } = Dimensions.get('window');

export default function ProductDetailScreen({ route }: any) {
  const [item, setItem] = useState<any>(undefined);
  const navigation = useNavigation();
  useEffect(() => {
    apiClient
      .getProduct(route.params.id)
      .then(setItem)
      .catch(() => Alert.alert('Error', 'Could not load product'));
  }, [route.params.id]);

  if (!item)
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#489163" />
      </SafeAreaView>
    );

  const imageUri =
    item.images?.[0] ||
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6';

  const harvest = item.harvestDate
    ? new Date(item.harvestDate).toLocaleDateString()
    : 'Not specified';

  const qualityLabel = item.quality || 'Not graded';

  // Determine badge style based on availability
  const badgeStyle = item.isAvailable ? styles.availableBadge : styles.outOfStockBadge;
  const badgeText = item.isAvailable ? 'Available' : 'Out of stock';
  
  // Determine order button style based on availability
  const orderButtonStyle = item.isAvailable ? styles.orderButton : styles.orderButtonDisabled;
  const orderButtonTextStyle = item.isAvailable ? styles.orderButtonText : styles.orderButtonTextDisabled;
  const orderButtonIconColor = item.isAvailable ? '#fff' : '#999';

  return (
    <View style={styles.container}>
      {/* TOP SECTION - IMAGE */}
      <View style={styles.topSection}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Product Image with overlay if out of stock */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.hero} />
          {!item.isAvailable && (
            <View style={styles.overlay}>
              <View style={styles.overlayContent}>
                <Feather name="x-circle" size={60} color="#fff" />
                <Text style={styles.overlayText}>Out of Stock</Text>
              </View>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeTxt}>{badgeText}</Text>
        </View>
      </View>

      {/* BOTTOM SECTION - DATA */}
      <View style={styles.bottomSection}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Name */}
          <Text style={styles.name}>{item.name}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>
              {item.price} SAR
            </Text>
            <Text style={[styles.unit, !item.isAvailable && styles.disabledText]}>
              / {item.unit}
            </Text>
          </View>

          {/* Stock Status Banner */}
          {!item.isAvailable && (
            <View style={styles.outOfStockBanner}>
              <Feather name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.outOfStockBannerText}>
                This product is currently out of stock. You can still message the seller for future availability.
              </Text>
            </View>
          )}

          {/* Info Card */}
          <View style={styles.card}>
            {/* Quantity with stock warning */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather 
                  name="package" 
                  size={20} 
                  color={item.quantity > 0 ? "#489163" : "#dc2626"} 
                />
                <Text style={styles.label}>Quantity in stock</Text>
              </View>
              <Text style={[
                styles.value, 
                item.quantity === 0 && styles.outOfStockValue
              ]}>
                {item.quantity}
                {item.quantity === 0 && ' (Empty)'}
              </Text>
            </View>

            {/* Harvest Date */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather name="calendar" size={20} color="#489163" />
                <Text style={styles.label}>Harvest date</Text>
              </View>
              <Text style={styles.value}>{harvest}</Text>
            </View>

            {/* Quality */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather name="star" size={20} color="#489163" />
                <Text style={styles.label}>Quality</Text>
              </View>
              <Text style={styles.value}>{qualityLabel}</Text>
            </View>

            {/* Category */}
            {item.category && (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Feather name="tag" size={20} color="#489163" />
                  <Text style={styles.label}>Category</Text>
                </View>
                <Text style={styles.value}>{item.category}</Text>
              </View>
            )}

            {/* Separator */}
            <View style={styles.separator} />

            {/* Farmer Information */}
            <Text style={styles.farmerTitle}>Seller Information</Text>
            <View style={styles.farmerBlock}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${item.farmer.name}&background=489163&color=fff`,
                }}
                style={[styles.farmerAvatar, !item.isAvailable && styles.disabledAvatar]}
              />
              <View style={styles.farmerInfo}>
                <Text style={styles.farmerName}>{item.farmer.name}</Text>
                <Text style={styles.farmerLocation}>
                  {item.farmer.location || 'Location not specified'}
                </Text>
                {item.farmer.phoneNumber && (
                  <Text style={styles.farmerPhone}>
                    {item.farmer.phoneNumber}
                  </Text>
                )}
              </View>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingTxt}>★ {item.farmer.rating || '0'}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => {
                if (!item.isAvailable) {
                  Alert.alert(
                    'Message Seller',
                    'This product is out of stock. You can message the seller to inquire about future availability.'
                  );
                }
              }}
            >
              <Feather 
                name="message-circle" 
                size={20} 
                color={item.isAvailable ? "#489163" : "#666"} 
              />
              <Text style={[
                styles.messageButtonText,
                !item.isAvailable && styles.disabledMessageButtonText
              ]}>
                Message Seller
              </Text>
            </TouchableOpacity>
            
            {/* <TouchableOpacity 
              style={orderButtonStyle}
              disabled={!item.isAvailable}
              onPress={() => {
                if (item.isAvailable) {
                  // Handle order placement
                }
              }}
            >
              <Feather name="shopping-cart" size={20} color={orderButtonIconColor} />
              <Text style={orderButtonTextStyle}>
                {item.isAvailable ? 'Place Order' : 'Out of Stock'}
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalTitle}>Product Details</Text>
            <Text style={[
              styles.additionalText,
              !item.isAvailable && styles.disabledAdditionalText
            ]}>
              {item.isAvailable ? (
                `Freshly harvested product with premium quality. ${item.createdAt && `Listed on ${new Date(item.createdAt).toLocaleDateString()}.`}`
              ) : (
                'This product is currently unavailable. Please contact the seller for information about future stock.'
              )}
            </Text>
          </View>

          {/* Last Updated Info */}
          {item.updatedAt && (
            <View style={styles.lastUpdated}>
              <Text style={styles.lastUpdatedText}>
                Last updated: {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

/* ----------  STYLES  ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  /* TOP SECTION STYLES */
  topSection: {
    height: height * 0.4,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 45,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  
  /* BADGE STYLES */
  badge: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  availableBadge: {
    backgroundColor: '#2d5016', // Dark green for available
  },
  outOfStockBadge: {
    backgroundColor: '#dc2626', // Red for out of stock
  },
  badgeTxt: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700' 
  },

  /* BOTTOM SECTION STYLES */
  bottomSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 24,
    marginBottom: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#489163',
  },
  unit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  disabledText: {
    color: '#999',
  },
  
  /* OUT OF STOCK BANNER */
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    gap: 12,
  },
  outOfStockBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 18,
  },
  
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { 
    fontSize: 15, 
    color: '#666',
    marginLeft: 12,
  },
  value: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111' 
  },
  outOfStockValue: {
    color: '#dc2626',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 24,
  },
  farmerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  farmerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  disabledAvatar: {
    opacity: 0.6,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111',
    marginBottom: 2,
  },
  farmerLocation: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 2,
  },
  farmerPhone: {
    fontSize: 14,
    color: '#489163',
    fontWeight: '500',
  },
  ratingBox: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingTxt: { 
    color: '#d97706', 
    fontWeight: '700',
    fontSize: 14,
  },
  
  /* ACTION BUTTONS */
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    color: '#489163',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledMessageButtonText: {
    color: '#999',
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#489163',
    borderRadius: 12,
    gap: 8,
  },
  orderButtonDisabled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    gap: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orderButtonTextDisabled: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  
  /* ADDITIONAL INFO */
  additionalInfo: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  additionalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disabledAdditionalText: {
    color: '#999',
  },
  
  /* LAST UPDATED */
  lastUpdated: {
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});