import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useFarmerProductStore } from '../store/farmerProductStore';
import { Input, Button, Card } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';

type AddProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddProduct'>;
type EditProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProduct'>;
type EditProductRouteProp = RouteProp<RootStackParamList, 'EditProduct'>;

interface AddProductScreenProps {
  navigation: AddProductScreenNavigationProp;
}

interface EditProductScreenProps {
  navigation: EditProductScreenNavigationProp;
  route: EditProductRouteProp;
}

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  unit: string;
  description: string;
  harvestDate?: string;
  quality: string;
}

const PRODUCT_CATEGORIES = [
  'Fruits', 'Vegetables', 'Grains', 'Dairy', 'Meat', 'Poultry', 'Herbs', 'Nuts', 'Other'
];

const UNITS = [
  'kg', 'g', 'lb', 'oz', 'piece', 'dozen', 'bundle', 'box', 'bag', 'crate'
];

const AddEditProductScreen: React.FC<AddProductScreenProps | EditProductScreenProps> = (props) => {
  const navigation = useNavigation<AddProductScreenNavigationProp | EditProductScreenNavigationProp>();
  const { createProduct, updateProduct, loading } = useFarmerProductStore();

  const isEdit = 'route' in props && props.route.params?.product;
  const product = isEdit ? (props as EditProductScreenProps).route.params.product : null;

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price?.toString() || '',
    quantity: product?.quantity?.toString() || '',
    unit: product?.unit || 'kg',
    description: product?.description || '',
    harvestDate: product?.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : '',
    quality: product?.quality || '',
  });

  const [images, setImages] = useState<string[]>(product?.images || []);

  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter product name');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return false;
    }
    if (!formData.unit) {
      Alert.alert('Validation Error', 'Please select a unit');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one product image');
      return false;
    }
    return true;
  }, [formData, images]);

  const handleImagePicker = useCallback(async (useCamera: boolean = false) => {
    try {
      const options: ImageLibraryOptions | CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
      };

      const result = useCamera 
        ? await launchCamera(options as CameraOptions)
        : await launchImageLibrary(options);

      if (result.didCancel) return;
      if (result.errorCode || result.errorMessage) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imageUri) setImages(prev => [...prev, imageUri]);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

const handleSubmit = useCallback(async () => {
  if (!validateForm()) return;

  try {
    const formDataToSend = new FormData();
    
    // ✅ Convert all values to strings
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('category', formData.category);
    formDataToSend.append('price', formData.price); // Keep as string
    formDataToSend.append('quantity', formData.quantity); // Keep as string
    formDataToSend.append('unit', formData.unit);
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('quality', formData.quality.trim());
    
    if (formData.harvestDate) {
      formDataToSend.append('harvestDate', formData.harvestDate);
    }

    // ✅ Properly format images for React Native
    images.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formDataToSend.append('images', {
        uri,
        name: filename,
        type: type,
      } as any);
    });

    if (isEdit && product) {
      await updateProduct(product.id, formDataToSend);
    } else {
      await createProduct(formDataToSend);
    }

    Alert.alert(
      'Success', 
      isEdit ? 'Product updated successfully' : 'Product created successfully',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } catch (error: any) {
    console.error('Submit error:', error);
    Alert.alert('Error', error?.message || 'Failed to save product');
  }
}, [formData, images, isEdit, product, createProduct, updateProduct, navigation, validateForm]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Card containerStyle={styles.formCard}>
            {/* Product Images */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Images *</Text>
              <View style={styles.imagesContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.productImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 5 && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={() => handleImagePicker(false)}
                  >
                    <Icon name="add-a-photo" size={32} color="#666" />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Input
                placeholder="Product Name *"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                leftIcon={<Icon name="inventory" size={20} color="#666" />}
              />

              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Category',
                    '',
                    PRODUCT_CATEGORIES.map(category => ({
                      text: category,
                      onPress: () => setFormData(prev => ({ ...prev, category })),
                    }))
                  );
                }}
              >
                <Icon name="category" size={20} color="#666" style={styles.pickerIcon} />
                <Text style={[styles.pickerText, formData.category && styles.pickerTextSelected]}>
                  {formData.category || 'Select Category *'}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666" />
              </TouchableOpacity>

              <Input
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                leftIcon={<Icon name="description" size={20} color="#666" />}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Pricing & Quantity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing & Quantity</Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    placeholder="Price *"
                    value={formData.price}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.input}
                    leftIcon={<Icon name="attach-money" size={20} color="#666" />}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Input
                    placeholder="Quantity *"
                    value={formData.quantity}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.input}
                    leftIcon={<Icon name="format-list-numbered" size={20} color="#666" />}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Unit',
                    '',
                    UNITS.map(unit => ({
                      text: unit,
                      onPress: () => setFormData(prev => ({ ...prev, unit })),
                    }))
                  );
                }}
              >
                <Icon name="straighten" size={20} color="#666" style={styles.pickerIcon} />
                <Text style={[styles.pickerText, formData.unit && styles.pickerTextSelected]}>
                  {formData.unit || 'Select Unit *'}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

   
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <Input
                placeholder="Quality (Optional)"
                value={formData.quality}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quality: text }))}
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                leftIcon={<Icon name="star" size={20} color="#666" />}
              />
              <Input
                placeholder="Harvest Date (Optional)"
                value={formData.harvestDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, harvestDate: text }))}
                containerStyle={styles.inputContainer}
                inputStyle={styles.input}
                leftIcon={<Icon name="calendar-today" size={20} color="#666" />}
              />
            </View>

            <Button
              title={isEdit ? 'Update Product' : 'Create Product'}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              buttonStyle={styles.submitButton}
              containerStyle={styles.submitButtonContainer}
              icon={<Icon name={isEdit ? "update" : "add-circle"} size={20} color="#fff" />}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  formCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: { paddingHorizontal: 0 },
  input: { fontSize: 16, color: '#333' },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  pickerIcon: { marginRight: 10 },
  pickerText: { flex: 1, fontSize: 16, color: '#999' },
  pickerTextSelected: { color: '#333' },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  submitButton: { backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 16, marginTop: 8 },
  submitButtonContainer: { marginTop: 8 },
});

export default AddEditProductScreen;
