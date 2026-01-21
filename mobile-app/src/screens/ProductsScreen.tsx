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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';
import { apiClient, getErrorMessage } from '../services/api';
import { Product } from '../types';

interface ProductsScreenProps {
    navigation: any;
}

const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { addToCart } = useCartStore();
const handleNavigateToDetails = (product: Product) => {
    navigation.navigate('ProductDetail', {  id: product.id  });
};

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getProducts();
            setProducts(response);
        } catch (error) {
            console.error('Error fetching products:', getErrorMessage(error));
            Alert.alert('Error', 'Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
        Alert.alert('Success', `${product.name} added to cart!`);
    };

 const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
        <Image
            source={{ uri: item.images[0] || 'https://via.placeholder.com/300' }}
            style={styles.productImage}
            resizeMode="cover"
        />

        <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
                {item.name}
            </Text>

            <View style={styles.priceContainer}>
                <Text style={styles.price}>{item.price} SAR</Text>
                <Text style={styles.unit}> / {item.unit}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleNavigateToDetails(item)}
                >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                >
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
);


    if (loading) {
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
                {/* Header with Title */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Farm Fresh Products</Text>
                    <Text style={styles.subtitle}>Direct from local farmers</Text>
                </View>
                
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    
                    <TouchableOpacity style={styles.filterButton}>
                        <Text style={styles.filterIcon}>⚙</Text>
                    </TouchableOpacity>
                </View>

                {/* Products Grid */}
             <FlatList
    data={filteredProducts}
    renderItem={renderProduct}
    keyExtractor={(item) => item.id}
    numColumns={1}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingBottom: 20 }}
    ListEmptyComponent={
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
        </View>
    }
/>

            </View>
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
    // Header styles
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
        marginBottom: 20,
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
    },
    filterIcon: {
        fontSize: 20,
        color: '#666',
    },
    listContent: {
        paddingBottom: 20,
    },
    // row: {
    //     justifyContent: 'space-between',
    //     marginBottom: 16,
    // },
    // Product card with border
    productCard: {
        // width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e8e8e8',
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f5f5f5',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        minHeight: 40,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#489163',
    },
    unit: {
        fontSize: 14,
        color: '#666',
    },
    // addButton: {
    //     backgroundColor: '#5a7c47',
    //     paddingVertical: 10,
    //     paddingHorizontal: 16,
    //     borderRadius: 8,
    //     alignItems: 'center',
    //     borderWidth: 1,
    //     borderColor: '#4a6c37',
    // },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
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

});

export default ProductsScreen;