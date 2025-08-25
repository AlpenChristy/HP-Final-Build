import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Clock, Hash, MapPin, Phone, ShoppingBag, Truck, Wallet, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderService } from '../../core/services/orderService';

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
  greenLighter: '#F0FDF4',
  yellow: '#F59E0B',
  yellowLighter: '#FFFBEB',
};

// --- Order Data Interface ---
interface OrderCompleteData {
    id: string | undefined;
    total: number;
    paymentMode: string;
    address: string;
    consumerNumber?: string;
    items?: any[];
    subtotal?: number;
    discount?: number;
}

export default function OrderPlacedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderCompleteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load order data from params or fetch from database
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        // Check if order ID is passed as parameter
        if (params.orderId) {
          // Try to get order by custom ID first, then fallback to Firebase ID
          let order = await orderService.getOrderByCustomId(params.orderId as string);
          if (!order) {
            // Fallback to Firebase document ID for backward compatibility
            order = await orderService.getOrderById(params.orderId as string);
          }
          if (order) {
            setOrderData({
              id: order.orderId || order.id,
              total: order.total,
              paymentMode: order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod,
              address: order.deliveryAddress,
              consumerNumber: order.consumerNumber,
              items: order.items,
              subtotal: order.subtotal,
              discount: order.discount
            });
          }
        } else {
          // Fallback to mock data if no order ID
          setOrderData({
            id: 'ORD003',
            total: 1345,
            paymentMode: 'Cash on Delivery',
            address: '123, Main Street, Near Water Tank, Vadodara, Gujarat - 390001'
          });
        }
      } catch (error) {
        console.error('Error loading order data:', error);
        // Fallback to mock data on error
        setOrderData({
          id: 'ORD003',
          total: 1345,
          paymentMode: 'Cash on Delivery',
          address: '123, Main Street, Near Water Tank, Vadodara, Gujarat - 390001'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [params.orderId]);

  if (!fontsLoaded || isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  if (!orderData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Close (cross) button */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => router.back()}
        style={[styles.closeButton, { top: insets.top + 8 }]}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <X size={20} color={Colors.text} />
      </TouchableOpacity>
       
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Success Header */}
        <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
                <Check size={48} color={Colors.white} />
            </View>
            <Text style={styles.successTitle}>Order Confirmed!</Text>
            <Text style={styles.successSubtitle}>
                Your order has been successfully placed and is being processed. We'll notify you about the delivery status.
            </Text>
            <View style={styles.orderIdBadge}>
                <Text style={styles.orderIdText}>#{orderData.id || 'N/A'}</Text>
            </View>
        </View>

        {/* Delivery Timeline */}
        <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Delivery Timeline</Text>
            <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                    <Check size={16} color={Colors.white} />
                </View>
                <View style={styles.timelineContent}>
                    <Text style={styles.timelineStep}>Order Confirmed</Text>
                    <Text style={styles.timelineTime}>Just now</Text>
                </View>
            </View>
            <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, styles.timelineIconPending]}>
                    <Clock size={16} color={Colors.textSecondary} />
                </View>
                <View style={styles.timelineContent}>
                    <Text style={styles.timelineStep}>Processing</Text>
                    <Text style={styles.timelineTime}>Within 1 hour</Text>
                </View>
            </View>
            <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, styles.timelineIconPending]}>
                    <Truck size={16} color={Colors.textSecondary} />
                </View>
                <View style={styles.timelineContent}>
                    <Text style={styles.timelineStep}>Out for Delivery</Text>
                    <Text style={styles.timelineTime}>Within 24 hours</Text>
                </View>
            </View>
            <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, styles.timelineIconPending]}>
                    <Check size={16} color={Colors.textSecondary} />
                </View>
                <View style={styles.timelineContent}>
                    <Text style={styles.timelineStep}>Delivered</Text>
                    <Text style={styles.timelineTime}>Cash on Delivery</Text>
                </View>
            </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            
            <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                    <Hash size={20} color={Colors.primary} />
                    <Text style={styles.summaryLabel}>Order ID</Text>
                </View>
            </View>
            <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValueText}>#{orderData.id || 'N/A'}</Text>
            </View>
            
            <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                    <ShoppingBag size={20} color={Colors.primary} />
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                </View>
            </View>
            <View style={styles.summaryValueContainer}>
                <Text style={[styles.summaryValueText, styles.totalAmountText]}>₹{orderData.total.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                    <Wallet size={20} color={Colors.primary} />
                    <Text style={styles.summaryLabel}>Payment Mode</Text>
                </View>
            </View>
            <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValueText}>{orderData.paymentMode}</Text>
            </View>
            
            <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                    <MapPin size={20} color={Colors.primary} />
                    <Text style={styles.summaryLabel}>Deliver to</Text>
                </View>
            </View>
            <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValueText}>{orderData.address}</Text>
            </View>
            
            {orderData.consumerNumber && (
                <>
                    <View style={styles.summaryItem}>
                        <View style={styles.summaryItemLeft}>
                            <Hash size={20} color={Colors.primary} />
                            <Text style={styles.summaryLabel}>Consumer Number</Text>
                        </View>
                    </View>
                    <View style={styles.summaryValueContainer}>
                        <Text style={styles.summaryValueText}>{orderData.consumerNumber}</Text>
                    </View>
                </>
            )}
        </View>

        {/* Support Section */}
        <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportSubtitle}>
                Our customer support team is here to help you with any questions about your order.
            </Text>
            <TouchableOpacity 
                style={styles.supportButton}
                onPress={() => Linking.openURL('tel:+919876543210')}
            >
                <Phone size={20} color={Colors.white} />
                <Text style={styles.supportButtonText}>Call Support</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingTop: 40,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.green}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
    marginBottom: 20,
  },
  orderIdBadge: {
    backgroundColor: Colors.primaryLighter,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  orderIdText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  // Timeline styles
  timelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineIconPending: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStep: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
  },
  summaryValueContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  summaryValueText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    paddingLeft: 32,
  },
  totalAmountText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  addressValue: {
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  // Support section styles
  supportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  supportTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  supportButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  supportButtonText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },

  closeButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
});