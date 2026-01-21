import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';
import { apiClient, getErrorMessage } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface CartScreenProps {
    navigation: any;
}

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
    const { items, total, updateQuantity, removeFromCart, clearCart } = useCartStore();
    const { user } = useAuthStore();

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const handleRemoveItem = (productId: string) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: () => removeFromCart(productId)
                }
            ]
        );
    };

    const handleCheckout = async () => {
        if (!user) {
            Alert.alert('Error', 'Please log in to complete your order.');
            return;
        }

        try {
            // Group items by farmer
            const ordersByFarmer: Record<string, any[]> = {};
            
            items.forEach(item => {
                if (!ordersByFarmer[item.farmerId]) {
                    ordersByFarmer[item.farmerId] = [];
                }
                ordersByFarmer[item.farmerId].push({
                    productId: item.id,
                    quantity: item.cartQuantity,
                    price: item.price,
                });
            });

            // Create orders for each farmer
            const orderPromises = Object.entries(ordersByFarmer).map(
                async ([farmerId, orderItems]) => {
                    return apiClient.createOrder({
                        farmerId,
                        items: orderItems,
                    });
                }
            );

            await Promise.all(orderPromises);
            
            Alert.alert(
                'Order Placed!',
                'Your order has been successfully placed. You will receive a confirmation soon.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            clearCart();
                            navigation.goBack();
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Checkout error:', getErrorMessage(error));
            Alert.alert('Error', 'Failed to place order. Please try again.');
        }
    };

    const renderCartItem = ({ item }: { item: any }) => (
        <View style={styles.cartItem}>
            <Image 
                source={{ uri: item.images[0] || 'https://via.placeholder.com/80' }}
                style={styles.itemImage}
                resizeMode="cover"
            />
            
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemPrice}>${item.price} / {item.unit}</Text>
                
                <View style={styles.quantityControls}>
                    <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(item.id, item.cartQuantity - 1)}
                    >
                        <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityText}>{item.cartQuantity}</Text>
                    
                    <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(item.id, item.cartQuantity + 1)}
                    >
                        <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={styles.itemTotal}>
                <Text style={styles.totalText}>${(item.price * item.cartQuantity).toFixed(2)}</Text>
                <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                >
                    <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>
                        Browse our products and add something to your cart!
                    </Text>
                    <TouchableOpacity 
                        style={styles.continueShoppingButton}
                        onPress={() => navigation.navigate('Products')}
                    >
                        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.title}>Shopping Cart</Text>
                <Text style={styles.itemCount}>({items.length} items)</Text>
            </View>

            <FlatList
                data={items}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                >
                    <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.continueShoppingButton}
                    onPress={() => navigation.navigate('Products')}
                >
                    <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    itemCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    listContent: {
        padding: 16,
    },
    cartItem: {
        flexDirection: 'row',
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fafafa',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    itemCategory: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
    itemPrice: {
        fontSize: 14,
        color: '#489163',
        fontWeight: '500',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e5e5e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        minWidth: 30,
        textAlign: 'center',
    },
    itemTotal: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    removeButton: {
        padding: 4,
    },
    removeButtonText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        gap: 12,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#489163',
    },
    checkoutButton: {
        backgroundColor: '#489163',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    continueShoppingButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#489163',
    },
    continueShoppingText: {
        color: '#489163',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CartScreen;