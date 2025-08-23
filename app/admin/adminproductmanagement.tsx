import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Edit, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import services
import { useAdminNavigation } from '../../core/auth/StableAdminLayout';
import { pickImage, takePhoto, uploadToCloudinary } from '../../core/services/cloudinaryService';
import { Product, addProduct, deleteProduct, getProducts, updateProduct } from '../../core/services/productService';

// --- Color Palette (Matched with other pages) ---
const Colors = {
  primary: '#0D47A1',
  primaryLight: '#1E88E5',
  primaryLighter: '#E3F2FD',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D3557',
  textSecondary: '#6C757D',
  border: '#EAECEF',
  white: '#FFFFFF',
  red: '#DC2626',
  redLighter: '#FFEBEE',
  green: '#16A34A',
};

export default function AdminProductsScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { goBack } = useAdminNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'gas',
    price: '',
    originalPrice: '',
    description: '',
    inStock: true,
    quantity: '',
  });

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setSelectedImage(product.image);
      setFormData({
        name: product.name,
        type: product.type,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        description: product.description,
        inStock: product.inStock,
        quantity: product.quantity?.toString() || '',
      });
    } else {
      setEditingProduct(null);
      setSelectedImage(null);
      setFormData({
        name: '',
        type: 'gas',
        price: '',
        originalPrice: '',
        description: '',
        inStock: true,
        quantity: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    setSelectedImage(null);
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select an image',
      [
        { text: 'Camera (Full)', onPress: () => handleTakePhoto(false) },
        { text: 'Camera (Crop)', onPress: () => handleTakePhoto(true) },
        { text: 'Gallery (Full)', onPress: () => handlePickImage(false) },
        { text: 'Gallery (Crop)', onPress: () => handlePickImage(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePickImage = async (allowsEditing: boolean = false) => {
    try {
      setUploadingImage(true);
      const imageAsset = await pickImage({ allowsEditing, aspect: allowsEditing ? [4, 3] : undefined });
      if (imageAsset) {
        const imageUrl = await uploadToCloudinary(imageAsset.uri);
        setSelectedImage(imageUrl);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTakePhoto = async (allowsEditing: boolean = false) => {
    try {
      setUploadingImage(true);
      const imageAsset = await takePhoto({ allowsEditing, aspect: allowsEditing ? [4, 3] : undefined });
      if (imageAsset) {
        const imageUrl = await uploadToCloudinary(imageAsset.uri);
        setSelectedImage(imageUrl);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return false;
    }
    if (!formData.price.trim()) {
      Alert.alert('Error', 'Price is required');
      return false;
    }
    if (!selectedImage) {
      Alert.alert('Error', 'Product image is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const productData: Omit<Product, 'id' | 'createdAt'> = {
        name: formData.name.trim(),
        type: formData.type,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice) || undefined,
        description: formData.description.trim(),
        image: selectedImage!,
        inStock: formData.inStock,
        quantity: formData.inStock && formData.quantity ? parseFloat(formData.quantity) : undefined,
      };

      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id!, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Add new product
        await addProduct(productData);
        Alert.alert('Success', 'Product added successfully');
      }

      // Reload products
      await loadProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
              await loadProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[Colors.primaryLight, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={goBack} style={styles.headerIcon}>
                <ArrowLeft size={26} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Management</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} style={styles.headerIcon}>
            <Plus size={26} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.productsScrollView} contentContainerStyle={styles.productsList}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first product to get started'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productContent}>
                  <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription} numberOfLines={1}>{product.description}</Text>
                      <Text style={styles.price}>₹{product.price}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                      <View style={[styles.stockBadge, {backgroundColor: product.inStock ? `${Colors.green}1A` : `${Colors.red}1A`}]}>
                          <Text style={[styles.stockText, {color: product.inStock ? Colors.green : Colors.red}]}>
                              {product.inStock 
                                ? `In Stock${product.quantity ? ` (${product.quantity})` : ''}` 
                                : 'Out of Stock'
                              }
                          </Text>
                      </View>
                      <View style={styles.productActions}>
                          <TouchableOpacity 
                              style={styles.actionButton}
                              onPress={() => openModal(product)}
                          >
                              <Edit size={18} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDelete(product.id!)}
                          >
                              <Trash2 size={18} color={Colors.red} />
                          </TouchableOpacity>
                      </View>
                  </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>



      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {paddingBottom: insets.bottom}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
                <View style={styles.modalForm}>
                  {/* Image Upload Section */}
                  <TouchableOpacity 
                    style={styles.imageUploader} 
                    onPress={handleImagePicker}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : selectedImage ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                        <View style={styles.imageOverlay}>
                          <Camera size={20} color={Colors.white} />
                          <Text style={styles.changeImageText}>Change Image</Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <UploadCloud size={24} color={Colors.textSecondary} />
                        <Text style={styles.imageUploaderText}>Upload Product Image</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder="e.g., HP Gas 14.2kg"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Type</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.type}
                      onChangeText={(text) => setFormData({ ...formData, type: text })}
                      placeholder="e.g., gas"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>



                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                      placeholder="e.g., 850"
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Original Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.originalPrice}
                      onChangeText={(text) => setFormData({ ...formData, originalPrice: text })}
                      placeholder="e.g., 900"
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Stock Status</Text>
                    <View style={styles.stockToggle}>
                      <TouchableOpacity
                        style={[
                          styles.stockOption,
                          formData.inStock && styles.stockOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, inStock: true })}
                      >
                        <Text style={[
                          styles.stockOptionText,
                          formData.inStock && styles.stockOptionTextActive
                        ]}>In Stock</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.stockOption,
                          !formData.inStock && styles.stockOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, inStock: false, quantity: '' })}
                      >
                        <Text style={[
                          styles.stockOptionText,
                          !formData.inStock && styles.stockOptionTextActive
                        ]}>Out of Stock</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {formData.inStock && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Available Quantity</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.quantity}
                        onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                        placeholder="e.g., 25"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Enter a short description"
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    marginLeft: 12,
  },
  searchSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
  },
  productsScrollView: {
    flex: 1,
  },
  productsList: {
    padding: 20,
  },
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 76,
    height: 100,
    marginTop:26,
    // borderTopLeftRadius: 16,
    // borderBottomLeftRadius: 16,
  },
  productContent: {
      flex: 1,
      justifyContent: 'space-between',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  productDescription: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
  },
  stockBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  stockText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.primaryLighter,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.redLighter,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  modalForm: {
    padding: 20,
  },
  imageUploader: {
      height: 120,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.background,
      marginBottom: 20,
  },
  imageUploaderText: {
      marginTop: 8,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  stockToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: Colors.background,
    padding: 4,
  },
  stockOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  stockOptionActive: {
    backgroundColor: Colors.primary,
  },
  stockOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  stockOptionTextActive: {
    color: Colors.white,
  },
});