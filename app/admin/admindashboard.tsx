// File: app/admin/admindashboard.tsx
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, CheckCircle, Minus, Package, Plus, Truck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { getProducts, Product, updateProduct } from '../../core/services/productService';
import { createToastHelpers } from '../../core/utils/toastUtils';

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
  green: '#16A34A',
  yellow: '#F59E0B',
  red: '#DC2626',
};

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { userSession } = useAuth();
  const toast = createToastHelpers();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuantities, setEditingQuantities] = useState<{ [key: string]: string }>({});

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load products on component mount
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
      toast.showLoadError('products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (product: Product, newQuantity: number) => {
    try {
      await updateProduct(product.id!, {
        ...product,
        quantity: newQuantity,
        inStock: newQuantity > 0
      });
      
      // Refresh products
      await loadProducts();
      toast.showStockUpdatedSuccess();
      
      // Show specific warnings based on stock level
      if (newQuantity < 0) {
        toast.showStockBackorderWarning(product.name, newQuantity);
      } else if (newQuantity === 0) {
        toast.showStockOutWarning(product.name);
      } else if (newQuantity <= 5) {
        toast.showStockLowWarning(product.name, newQuantity);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.showStockUpdateError();
    }
  };

  const handleIncrementStock = (product: Product) => {
    const currentQuantity = product.quantity || 0;
    handleUpdateStock(product, currentQuantity + 1);
  };

  const handleDecrementStock = (product: Product) => {
    const currentQuantity = product.quantity || 0;
    if (currentQuantity > 0) {
      handleUpdateStock(product, currentQuantity - 1);
    } else {
      toast.showWarning('Stock Warning', 'Stock is already at 0');
    }
  };

  const handleDirectStockUpdate = (product: Product, newQuantity: string) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.showInvalidQuantityError();
      return;
    }
    handleUpdateStock(product, quantity);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    setEditingQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleQuantitySubmit = (product: Product) => {
    const editingValue = editingQuantities[product.id!];
    if (editingValue !== undefined) {
      const quantity = parseInt(editingValue);
      if (isNaN(quantity) || quantity < 0) {
        toast.showInvalidQuantityError();
        // Reset to original value
        setEditingQuantities(prev => ({
          ...prev,
          [product.id!]: (product.quantity || 0).toString()
        }));
        return;
      }
      handleUpdateStock(product, quantity);
    }
    // Clear editing state
    setEditingQuantities(prev => {
      const newState = { ...prev };
      delete newState[product.id!];
      return newState;
    });
  };

  const handleQuantityBlur = (product: Product) => {
    handleQuantitySubmit(product);
  };

  // Calculate stock recommendations
  const getStockRecommendation = (product: Product) => {
    const currentQuantity = product.quantity || 0;
    if (currentQuantity < 0) {
      return `URGENT: Backorder - ${Math.abs(currentQuantity)} units needed!`;
    } else if (currentQuantity === 0) {
      return 'URGENT: Restock needed - product is out of stock!';
    } else if (currentQuantity <= 5) {
      return `Restock needed - only ${currentQuantity} left`;
    } else if (currentQuantity <= 10) {
      return `Consider restocking - ${currentQuantity} available`;
    } else {
      return `Well stocked - ${currentQuantity} available`;
    }
  };

  // Calculate dashboard stats
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => (p.quantity || 0) > 0).length;
  const lowStockProducts = products.filter(p => (p.quantity || 0) <= 5 && (p.quantity || 0) > 0).length;
  const outOfStockProducts = products.filter(p => (p.quantity || 0) === 0).length;
  const backorderProducts = products.filter(p => (p.quantity || 0) < 0).length;
  const availableForCustomers = products.length; // All products are visible to customers

  const stats = [
    { title: 'Total Products', value: totalProducts.toString(), icon: Package },
    { title: 'In Stock', value: inStockProducts.toString(), icon: CheckCircle },
    { title: 'Low Stock (≤5)', value: lowStockProducts.toString(), icon: AlertTriangle },
    { title: 'Out of Stock', value: (outOfStockProducts + backorderProducts).toString(), icon: Truck },
  ];

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[Colors.primaryLight, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>
          {userSession?.role === 'sub-admin' ? 'Sub-Admin Dashboard' : 'Admin Dashboard'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Welcome, {userSession?.displayName || (userSession?.role === 'sub-admin' ? 'Sub-Admin' : 'Admin')}!
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const getCardColor = () => {
              switch (stat.title) {
                case 'Total Products': return { bg: '#E3F2FD', icon: '#1976D2' };
                case 'In Stock': return { bg: '#E8F5E8', icon: '#2E7D32' };
                case 'Low Stock': return { bg: '#FFF8E1', icon: '#F57C00' };
                case 'Out of Stock': return { bg: '#FFEBEE', icon: '#D32F2F' };
                default: return { bg: Colors.primaryLighter, icon: Colors.primary };
              }
            };
            const colors = getCardColor();
            
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: colors.bg }]}>
                  <stat.icon size={20} color={colors.icon} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stock Management</Text>
            <TouchableOpacity onPress={async () => {
              await loadProducts();
              toast.showDashboardRefreshSuccess();
            }}>
              <Text style={styles.viewAllText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.stockListContainer}>
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No products found</Text>
                <Text style={styles.emptyStateSubtext}>Add products to manage stock</Text>
              </View>
            ) : (
              products.map((product, index) => (
                <View key={product.id} style={[styles.stockCard, index === products.length - 1 && {borderBottomWidth: 0}]}>
                                    <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                    <View style={styles.stockStatus}>
                      <View style={[
                        styles.stockBadge, 
                        { 
                          backgroundColor: (product.quantity || 0) < 0
                            ? `${Colors.red}2A`
                            : (product.quantity || 0) === 0
                              ? `${Colors.red}1A`
                              : (product.quantity || 0) <= 5 
                                ? `${Colors.yellow}1A` 
                                : `${Colors.green}1A`
                        }
                      ]}>
                        <Text style={[
                          styles.stockBadgeText, 
                          { 
                            color: (product.quantity || 0) < 0
                              ? Colors.red
                              : (product.quantity || 0) === 0
                                ? Colors.red
                                : (product.quantity || 0) <= 5 
                                  ? Colors.yellow 
                                  : Colors.green
                          }
                        ]}>
                                                  {(product.quantity || 0) < 0 
                          ? `Backorder (${Math.abs(product.quantity || 0)})`
                          : (product.quantity || 0) === 0 
                            ? 'Out of Stock'
                            : (product.quantity || 0) <= 5 
                              ? `Low Stock (${product.quantity || 0})` 
                              : `In Stock (${product.quantity || 0})`
                        }
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.stockRecommendation}>
                      {getStockRecommendation(product)}
                    </Text>
                  </View>
                  <View style={styles.stockControls}>
                    <TextInput
                      style={styles.stockInput}
                      value={editingQuantities[product.id!] !== undefined 
                        ? editingQuantities[product.id!] 
                        : (product.quantity || 0).toString()
                      }
                      onChangeText={(text) => handleQuantityChange(product.id!, text)}
                      onBlur={() => handleQuantityBlur(product)}
                      onSubmitEditing={() => handleQuantitySubmit(product)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <View style={styles.stockButtons}>
                      <TouchableOpacity 
                        style={styles.stockButton}
                        onPress={() => handleDecrementStock(product)}
                      >
                        <Minus size={16} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.stockButton}
                        onPress={() => handleIncrementStock(product)}
                      >
                        <Plus size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.white,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 20,
  },
  stockListContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
    marginBottom: 12,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  stockRecommendation: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  stockControls: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  stockInput: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
  },
  stockButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  stockButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
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
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
