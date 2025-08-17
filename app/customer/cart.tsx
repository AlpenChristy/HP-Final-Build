import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle, Minus, Plus, Tag, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../core/context/CartContext';
import { PromocodeData, promocodeService } from '../../core/services/promocodeService';

// --- Color Palette (Matched with previous screens) ---
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
  red: '#DC2626',
};

// --- Mock Cart Data ---
const initialCartItems = [
    {
      id: '1',
      product: 'HP Gas 14.2kg',
      price: 850,
      quantity: 1,
      image: require('../../assets/images/gas-cylinder.jpg'),
    },
    {
      id: '2',
      product: 'HP Gas 5kg',
      price: 450,
      quantity: 1,
      image: require('../../assets/images/gas-cylinder.jpg'),
    },
];

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  
  console.log('CartScreen: About to use cart context');
  
  const { 
    cartItems, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal,
    appliedPromocode,
    discount,
    setAppliedPromocode,
    setDiscount,
    clearPromocode,
    recalculatePromocodeDiscount
  } = useCart();
  
  console.log('CartScreen: Cart context loaded successfully', { 
    cartItemsCount: cartItems?.length, 
    loading, 
    appliedPromocode: !!appliedPromocode, 
    discount 
  });
  const [promoCode, setPromoCode] = useState('');
  const [isLoadingPromocode, setIsLoadingPromocode] = useState(false);
  const [promocodeError, setPromocodeError] = useState('');
  const [availablePromocodes, setAvailablePromocodes] = useState<PromocodeData[]>([]);
  const [showAvailablePromocodes, setShowAvailablePromocodes] = useState(false);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });

  // Load available promocodes
  useEffect(() => {
    const loadAvailablePromocodes = async () => {
      try {
        const promocodes = await promocodeService.getActivePromocodes();
        setAvailablePromocodes(promocodes);
      } catch (error) {
        console.error('Error loading available promocodes:', error);
        // Don't show error to user, just log it and continue without available promocodes
        // The promocode input will still work for manually entered codes
      }
    };

    loadAvailablePromocodes();
  }, []);

  // Recalculate discount when cart total changes
  useEffect(() => {
    if (appliedPromocode) {
      const result = recalculatePromocodeDiscount();
      
      if (!result.valid && result.error) {
        setPromocodeError(result.error);
      } else {
        setPromocodeError(''); // Clear any previous errors
      }
      
      console.log('Promocode discount recalculated:', {
        valid: result.valid,
        discount: result.discount,
        error: result.error
      });
    }
  }, [cartItems, appliedPromocode]); // Recalculate when cart items or applied promocode changes

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }

  const handleQuantityChange = (itemId: string, type: 'increase' | 'decrease') => {
  const item = cartItems.find(item => item.id === itemId);
  if (!item) return;
  
  let newQuantity = item.quantity;
  if (type === 'increase') {
    newQuantity++;
  } else if (type === 'decrease') {
    newQuantity = item.quantity > 1 ? item.quantity - 1 : 0;
  }
  
  if (newQuantity === 0) {
    removeFromCart(itemId);
  } else {
    updateQuantity(itemId, newQuantity);
  }
};
  
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromocodeError('Please enter a promo code');
      return;
    }

    setIsLoadingPromocode(true);
    setPromocodeError('');
    
    try {
      const subtotal = getCartTotal();
      const validation = await promocodeService.validatePromocode(promoCode.trim().toUpperCase(), subtotal);
      
      if (validation.valid && validation.promocode) {
        // Calculate discount based on promocode type
        let calculatedDiscount = 0;
        if (validation.promocode.discountType === 'percentage') {
          calculatedDiscount = (subtotal * validation.promocode.discountValue) / 100;
          // Apply maximum discount if set
          if (validation.promocode.maxDiscount && calculatedDiscount > validation.promocode.maxDiscount) {
            calculatedDiscount = validation.promocode.maxDiscount;
          }
        } else {
          calculatedDiscount = validation.promocode.discountValue;
        }
        
        setDiscount(calculatedDiscount);
        setAppliedPromocode(validation.promocode);
        setPromocodeError('');
      } else {
        clearPromocode();
        setPromocodeError(validation.error || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error applying promocode:', error);
      clearPromocode();
      setPromocodeError('Error applying promo code. Please try again.');
    } finally {
      setIsLoadingPromocode(false);
    }
  };

  const handleRemovePromocode = () => {
    setPromoCode('');
    clearPromocode();
    setPromocodeError('');
  };

  const calculateSubtotal = () => {
      return getCartTotal();
  };

  const deliveryCharge = cartItems.length > 0 ? 30 : 0;
  const subtotal = calculateSubtotal();
  const gstAmount = subtotal * 0.05; // 5% GST
  const totalAmount = subtotal + deliveryCharge + gstAmount - discount;

  const renderCartItem = (item: any) => (
  <View key={item.id} style={styles.itemCard}>
    <Image source={{ uri: item.product.image }} style={styles.itemImage} />
    <View style={styles.itemDetails}>
      <Text style={styles.itemName}>{item.product.name}</Text>
      <Text style={styles.itemPrice}>₹{item.product.price}</Text>
    </View>
    <View style={styles.quantitySelector}>
      <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(item.id, 'decrease')}>
        <Minus size={16} color={Colors.white} />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{item.quantity}</Text>
      <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(item.id, 'increase')}>
        <Plus size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  </View>
);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.push('/customer/products')} style={styles.headerIcon}>
            <ArrowLeft size={26} color={Colors.white} />
        </TouchableOpacity>
            <Text style={styles.headerTitle}>My Cart</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cart Items */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items in Cart</Text>
            {cartItems.length > 0 ? cartItems.map(renderCartItem) : <Text style={styles.emptyCartText}>Your cart is empty.</Text>}
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promo Code</Text>
            <View style={styles.promoInputContainer}>
                <Tag size={20} color={Colors.textSecondary} style={styles.promoIcon} />
                <TextInput 
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={Colors.textSecondary}
                    value={promoCode}
                    onChangeText={(text) => {
                        setPromoCode(text);
                        setPromocodeError(''); // Clear error when user types
                    }}
                    editable={!appliedPromocode} // Disable input when promocode is applied
                />
                {appliedPromocode ? (
                    <TouchableOpacity style={[styles.applyButton, { backgroundColor: Colors.red }]} onPress={handleRemovePromocode}>
                        <X size={16} color={Colors.white} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.applyButton, isLoadingPromocode && { opacity: 0.6 }]} 
                        onPress={handleApplyPromo}
                        disabled={isLoadingPromocode}
                    >
                        <Text style={styles.applyButtonText}>
                            {isLoadingPromocode ? 'Applying...' : 'Apply'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            
            {/* Promocode Success */}
            {appliedPromocode && (
                <View style={styles.promoSuccess}>
                    <CheckCircle size={16} color={Colors.green} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.promoSuccessText}>
                            {appliedPromocode.code} applied! You saved ₹{discount.toFixed(2)}
                        </Text>
                        {appliedPromocode.description && (
                            <Text style={styles.promoDescription}>{appliedPromocode.description}</Text>
                        )}
                    </View>
                </View>
            )}
            
            {/* Promocode Error */}
            {promocodeError && (
                <View style={styles.promoError}>
                    <Text style={styles.promoErrorText}>{promocodeError}</Text>
                </View>
            )}
            
            {/* Available Promocodes */}
            {availablePromocodes.length > 0 && (
                <View style={styles.availablePromocodes}>
                    <TouchableOpacity 
                        style={styles.showPromocodesButton}
                        onPress={() => setShowAvailablePromocodes(!showAvailablePromocodes)}
                    >
                        <Text style={styles.showPromocodesText}>
                            {showAvailablePromocodes ? 'Hide' : 'Show'} Available Promocodes ({availablePromocodes.length})
                        </Text>
                    </TouchableOpacity>
                    
                    {showAvailablePromocodes && (
                        <View style={styles.promocodesList}>
                            {availablePromocodes.map((promocode) => (
                                <View key={promocode.id} style={styles.promocodeItem}>
                                    <View style={styles.promocodeHeader}>
                                        <Text style={styles.promocodeCode}>{promocode.code}</Text>
                                        <Text style={styles.promocodeDiscount}>
                                            {promocode.discountType === 'percentage' 
                                                ? `${promocode.discountValue}% off` 
                                                : `₹${promocode.discountValue} off`
                                            }
                                        </Text>
                                    </View>
                                    {promocode.description && (
                                        <Text style={styles.promocodeItemDescription}>{promocode.description}</Text>
                                    )}
                                    {promocode.minOrderAmount && (
                                        <Text style={styles.promocodeMinOrder}>
                                            Min. order: ₹{promocode.minOrderAmount}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>

        {/* Order Details */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order details</Text>
            <View style={styles.billCard}>
                <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
                </View>
                {cartItems.length > 0 && (
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery Charge</Text>
                        <Text style={styles.billValue}>₹{deliveryCharge.toFixed(2)}</Text>
                    </View>
                )}
                {cartItems.length > 0 && (
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>GST (5%)</Text>
                        <Text style={styles.billValue}>₹{gstAmount.toFixed(2)}</Text>
                    </View>
                )}
                {discount > 0 && (
                    <View style={styles.billRow}>
                        <Text style={[styles.billLabel, {color: Colors.green}]}>Promo Discount</Text>
                        <Text style={[styles.billValue, {color: Colors.green}]}>- ₹{discount.toFixed(2)}</Text>
                    </View>
                )}
                <View style={styles.divider} />
                <View style={styles.billRow}>
                    <Text style={styles.billTotalLabel}>To Pay</Text>
                    <Text style={styles.billTotalValue}>₹{totalAmount.toFixed(2)}</Text>
                </View>
            </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      {cartItems.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 70 }]}>
          <View>
              <Text style={styles.footerTotalAmount}>₹{totalAmount.toFixed(2)}</Text>
              <Text style={styles.footerTotalLabel}>TOTAL</Text>
          </View>
          <TouchableOpacity 
              style={styles.checkoutButton} 
              onPress={async () => {
                  if (cartItems.length === 0) {
                      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
                      return;
                  }
                  
                  // Increment promocode usage if applied
                  if (appliedPromocode) {
                      try {
                          await promocodeService.incrementUsageCount(appliedPromocode.id);
                          console.log('Promocode usage incremented');
                      } catch (error) {
                          console.error('Error incrementing promocode usage:', error);
                      }
                  }
                  router.push('/customer/checkout');
              }}
          >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
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
  content: {
    padding: 20,
    paddingBottom: 120, // Space for the footer
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 18, // Circle
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginHorizontal: 16,
  },
  promoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promoIcon: {
    marginRight: 12,
  },
  promoInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  applyButton: {
    backgroundColor: Colors.primaryLighter,
    paddingHorizontal: 20,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  applyButtonText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  promoSuccess: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
  },
  promoSuccessText: {
      color: Colors.green,
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
  },
  promoDescription: {
      color: Colors.textSecondary,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 2,
  },
  promoError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
  },
  promoErrorText: {
      color: Colors.red,
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
  },
  availablePromocodes: {
      marginTop: 16,
  },
  showPromocodesButton: {
      paddingVertical: 8,
  },
  showPromocodesText: {
      color: Colors.primary,
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      textDecorationLine: 'underline',
  },
  promocodesList: {
      marginTop: 12,
      gap: 8,
  },
  promocodeItem: {
      backgroundColor: Colors.primaryLighter,
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
  },
  promocodeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
  },
  promocodeCode: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.primary,
  },
  promocodeDiscount: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.green,
  },
  promocodeItemDescription: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginBottom: 4,
  },
  promocodeMinOrder: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      fontStyle: 'italic',
  },
  billCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  billTotalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  footerTotalAmount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  footerTotalLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  emptyCartText: {
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    fontSize: 16,
    paddingVertical: 20,
  },
});