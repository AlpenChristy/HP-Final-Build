import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { router } from 'expo-router';
import { ArrowLeft, Hash, MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { useAddress } from '../../core/context/AddressContext';
import { useCart } from '../../core/context/CartContext';
import { useConsumerNumber } from '../../core/context/ConsumerNumberContext';
import { CreateOrderData, orderService } from '../../core/services/orderService';
import { UserData, userService } from '../../core/services/userService';

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
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { cartItems, getCartTotal, appliedPromocode, discount, clearCart } = useCart();
  const { userSession } = useAuth();
  const { address: deliveryAddress, updateAddress, isLoading: addressLoading } = useAddress();
  const { consumerNumber, updateConsumerNumber, isLoading: consumerNumberLoading } = useConsumerNumber();
  
  // State for user data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // State for address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showConsumerNumberModal, setShowConsumerNumberModal] = useState(false);
  const [newConsumerNumber, setNewConsumerNumber] = useState('');
  const [isSavingConsumerNumber, setIsSavingConsumerNumber] = useState(false);
  // Suppress empty-cart alert when we purposely cleared cart after placing order
  const suppressEmptyCartAlert = useRef(false);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });

  // Check if cart is empty and redirect (ignored when suppressed, e.g., after placing order)
  useEffect(() => {
    if (cartItems.length === 0) {
      if (suppressEmptyCartAlert.current) return;
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items to your cart before checkout.', [
        {
          text: 'OK',
          onPress: () => router.push('/customer/home')
        }
      ]);
    }
  }, [cartItems]);

  // Load user data (for other user info like name, email, etc.)
  const loadUserData = async () => {
    if (!userSession?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await userService.getUserById(userSession.uid);
      if (user) {
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userSession?.uid]);

  // Calculate order details
  const subtotal = getCartTotal();
  const totalAmount = subtotal - discount;

  // Handle address change
  const handleChangeAddress = () => {
    setNewAddress(deliveryAddress || '');
    setShowAddressModal(true);
  };

  // Handle add new address (when no address exists)
  const handleAddAddress = () => {
    setNewAddress('');
    setShowAddressModal(true);
  };

  // Handle save address
  const handleSaveAddress = async () => {
    if (!newAddress.trim()) return;

    setIsSavingAddress(true);
    try {
      // Update address using shared context (automatically syncs with profile)
      await updateAddress(newAddress.trim());
      setShowAddressModal(false);
      Alert.alert('Success', 'Address updated successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle change consumer number
  const handleChangeConsumerNumber = () => {
    setNewConsumerNumber(consumerNumber || '');
    setShowConsumerNumberModal(true);
  };

  // Handle add new consumer number (when no consumer number exists)
  const handleAddConsumerNumber = () => {
    setNewConsumerNumber('');
    setShowConsumerNumberModal(true);
  };

  // Handle save consumer number
  const handleSaveConsumerNumber = async () => {
    if (!newConsumerNumber.trim()) return;

    setIsSavingConsumerNumber(true);
    try {
      // Update consumer number using shared context (automatically syncs with profile)
      await updateConsumerNumber(newConsumerNumber.trim());
      setShowConsumerNumberModal(false);
      Alert.alert('Success', 'Consumer number updated successfully!');
    } catch (error) {
      console.error('Error saving consumer number:', error);
      Alert.alert('Error', 'Failed to save consumer number. Please try again.');
    } finally {
      setIsSavingConsumerNumber(false);
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!userSession?.uid || !userData) {
      Alert.alert('Error', 'Please login to place an order.');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please add a delivery address before placing your order.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);
    suppressEmptyCartAlert.current = true; // prevent empty-cart alert after we clear the cart
    try {
      const orderData: CreateOrderData = {
        userId: userSession.uid,
        customerName: userData.displayName,
        customerPhone: userData.phoneNumber || '',
        consumerNumber: consumerNumber || '',
        deliveryAddress: deliveryAddress.trim(),
        items: cartItems,
        subtotal,
        discount,
        total: totalAmount,
        appliedPromocode,
        paymentMethod: 'cod',
      };

      const orderId = await orderService.createOrder(orderData);
      
      // Clear cart after successful order
      await clearCart();
      
      // Keep loading state for a brief moment to show "Placing Order..." feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Directly navigate to order complete screen without showing alert
      router.push(`/customer/ordercomplete?orderId=${orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!fontsLoaded || isLoading || addressLoading || consumerNumberLoading) {
    return <View style={styles.loadingContainer} />;
  }



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/customer/cart')} style={styles.headerIcon}>
                <ArrowLeft size={26} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Delivery Address */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {deliveryAddress ? (
                <View style={styles.addressCard}>
                    <MapPin size={24} color={Colors.primary} />
                    <Text style={styles.addressText}>{deliveryAddress}</Text>
                    <TouchableOpacity onPress={handleChangeAddress}>
                        <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.addressCard}>
                    <MapPin size={24} color={Colors.textSecondary} />
                    <Text style={styles.addressText}>No address added</Text>
                    <TouchableOpacity onPress={handleAddAddress}>
                        <Text style={styles.changeButtonText}>Add Address</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {/* Consumer Number */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consumer Number (Optional)</Text>
            {consumerNumber ? (
                <View style={styles.addressCard}>
                    <Hash size={24} color={Colors.primary} />
                    <Text style={styles.addressText}>{consumerNumber}</Text>
                    <TouchableOpacity onPress={handleChangeConsumerNumber}>
                        <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.addressCard}>
                    <Hash size={24} color={Colors.textSecondary} />
                    <Text style={styles.addressText}>Add consumer number</Text>
                    <TouchableOpacity onPress={handleAddConsumerNumber}>
                        <Text style={styles.changeButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentContainer}>
                <View style={[styles.paymentOption, styles.paymentOptionSelected]}>
                    <Text style={[styles.paymentLabel, styles.paymentLabelSelected]}>Cash on Delivery</Text>
                    <View style={[styles.radioOuter, styles.radioSelected]}>
                        <View style={styles.radioInner}/>
                    </View>
                </View>
            </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order details</Text>
            <View style={styles.billCard}>
                <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
                </View>

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
      <View style={[styles.footer, { paddingBottom: insets.bottom + 70 }]}>
        <View>
            <Text style={styles.footerTotalAmount}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.footerTotalLabel}>TOTAL</Text>
        </View>
        <TouchableOpacity 
            style={[styles.checkoutButton, isPlacingOrder && { opacity: 0.6 }]} 
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
        >
            <Text style={styles.checkoutButtonText}>
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </Text>
        </TouchableOpacity>
      </View>

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {deliveryAddress ? 'Change Delivery Address' : 'Add Delivery Address'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your delivery address"
              placeholderTextColor={Colors.textSecondary}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, (!newAddress.trim() || isSavingAddress) && { opacity: 0.6 }]}
                onPress={handleSaveAddress}
                disabled={!newAddress.trim() || isSavingAddress}
              >
                <Text style={styles.modalSaveButtonText}>
                  {isSavingAddress ? 'Saving...' : (deliveryAddress ? 'Update' : 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Consumer Number Modal */}
      <Modal
        visible={showConsumerNumberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConsumerNumberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {consumerNumber ? 'Change Consumer Number' : 'Add Consumer Number'}
              </Text>
              <TouchableOpacity onPress={() => setShowConsumerNumberModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Consumer Number</Text>
              <TextInput
                style={styles.consumerNumberInput}
                placeholder="Enter your consumer number"
                placeholderTextColor={Colors.textSecondary}
                value={newConsumerNumber}
                onChangeText={setNewConsumerNumber}
                keyboardType="numeric"
                maxLength={20}
              />
              <Text style={styles.inputHelpText}>
                This is your gas connection number for delivery purposes
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowConsumerNumberModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, (!newConsumerNumber.trim() || isSavingConsumerNumber) && { opacity: 0.6 }]}
                onPress={handleSaveConsumerNumber}
                disabled={!newConsumerNumber.trim() || isSavingConsumerNumber}
              >
                            <Text style={styles.modalSaveButtonText}>
              {isSavingConsumerNumber ? 'Saving...' : (consumerNumber ? 'Update' : 'Save')}
            </Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 16,
  },
  addressCard: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      shadowColor: '#959DA5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
  },
  addressText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.text,
      lineHeight: 22,
  },
  changeButtonText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.primary,
  },
  paymentContainer: {
      gap: 12,
  },
  paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: Colors.border,
  },
  paymentOptionSelected: {
      backgroundColor: Colors.primaryLighter,
      borderColor: Colors.primary,
  },
  paymentLabel: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  paymentLabelSelected: {
      fontFamily: 'Inter_600SemiBold',
      color: Colors.primary,
  },
  radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
  },
  radioSelected: {
      borderColor: Colors.primary,
  },
  radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: Colors.primary,
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
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  modalCloseButton: {
    fontSize: 20,
    color: Colors.textSecondary,
    padding: 4,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    minHeight: 100,
    marginBottom: 20,
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
  consumerNumberInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    height: 50,
    marginBottom: 8,
  },
  inputHelpText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: Colors.white,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
});