import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, Package, Truck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { OrderData, orderService } from '../../core/services/orderService';

// --- Color Palette (Matched with ProductsScreen) ---
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

interface TrackingStep {
  step: string;
  completed: boolean;
  time: string;
}

interface ExtendedOrderData extends OrderData {
  trackingSteps?: TrackingStep[];
}

const getTrackingSteps = (order: OrderData): TrackingStep[] => {
  const steps: TrackingStep[] = [];
  const orderDate = new Date(order.orderDate);
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const expectedDelivery = order.expectedDelivery ? new Date(order.expectedDelivery) : null;

  // Order Placed
  steps.push({
    step: 'Order Placed',
    completed: true,
    time: orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  });

  // Confirmed
  if (order.orderStatus !== 'pending') {
    steps.push({
      step: 'Confirmed',
      completed: true,
      time: new Date(order.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    });
  } else {
    steps.push({ step: 'Confirmed', completed: false, time: 'Pending' });
  }

  // Out for Delivery
  if (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') {
    steps.push({
      step: 'Out for Delivery',
      completed: true,
      time: new Date(order.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    });
  } else {
    steps.push({
      step: 'Out for Delivery',
      completed: false,
      time: expectedDelivery ? 'Expected ' + expectedDelivery.toLocaleDateString() : 'Pending'
    });
  }

  // Delivered or Cancelled
  if (order.orderStatus === 'delivered' && deliveredAt) {
    steps.push({
      step: 'Delivered',
      completed: true,
      time: deliveredAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    });
  } else if (order.orderStatus === 'cancelled') {
    steps.push({
      step: 'Order Cancelled',
      completed: true,
      time: new Date(order.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    });
  } else {
    steps.push({
      step: 'Delivered',
      completed: false,
      time: expectedDelivery ? 'Expected by ' + expectedDelivery.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : 'Pending'
    });
  }

  return steps;
};

const getStatusInfo = (status: OrderData['orderStatus']) => {
    switch (status) {
      case 'delivered':
        return { Icon: CheckCircle, color: Colors.green };
      case 'out_for_delivery':
        return { Icon: Truck, color: Colors.primary };
      case 'confirmed':
        return { Icon: Package, color: Colors.yellow };
      case 'pending':
        return { Icon: Clock, color: Colors.textSecondary };
      case 'cancelled':
        return { Icon: X, color: Colors.red };
      default:
        return { Icon: Clock, color: Colors.textSecondary };
    }
  };

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { userSession } = useAuth();
  const [activeTab, setActiveTab] = useState('current');
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderData | null>(null);
  const [orders, setOrders] = useState<ExtendedOrderData[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to orders (real-time)
  useEffect(() => {
    if (!userSession?.uid) return;
    setLoading(true);
    const unsubscribe = orderService.subscribeOrdersByUser(userSession.uid, (userOrders) => {
      const ordersWithTracking = userOrders.map(order => ({
        ...order,
        trackingSteps: getTrackingSteps(order)
      }));
      setOrders(ordersWithTracking);
      setLoading(false);
    });
    return () => unsubscribe?.();
  }, [userSession?.uid]);

  // Set initial tab based on URL parameter
  useEffect(() => {
    if (params.tab === 'history') {
      setActiveTab('history');
    } else {
      setActiveTab('current');
    }
  }, [params.tab]);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentOrders = orders.filter(o => 
    o.orderStatus === 'pending' || 
    o.orderStatus === 'confirmed' || 
    o.orderStatus === 'out_for_delivery' ||
    o.orderStatus === 'cancelled'
  );
  const orderHistory = orders.filter(o => o.orderStatus === 'delivered');

  const handleViewInvoice = (order: ExtendedOrderData) => {
    setSelectedOrder(order);
    setInvoiceVisible(true);
  };

  const renderOrderCard = (order: ExtendedOrderData, showTracking = false) => {
    const { Icon, color } = getStatusInfo(order.orderStatus);
    const firstItem = order.items[0]; // Get first item for display
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
                            <Text style={styles.orderId}>#{order.orderId || order.id}</Text>
            <Text style={styles.productName}>
              {firstItem ? `${firstItem.product.name} (x${firstItem.quantity})` : 'No items'}
            </Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: `${color}1A` }]}>
            <Icon size={16} color={color} />
            <Text style={[styles.status, { color: color }]}>
              {order.orderStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ordered on:</Text>
            <Text style={styles.detailValue}>{orderDate}</Text>
          </View>
          {order.expectedDelivery && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected delivery:</Text>
              <Text style={styles.detailValue}>
                {new Date(order.expectedDelivery).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          )}
          {order.deliveredAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivered on:</Text>
              <Text style={styles.detailValue}>
                {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.totalAmount}>₹{order.total}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Details:</Text>
            <TouchableOpacity onPress={() => handleViewInvoice(order)}>
                <Text style={styles.linkText}>View Invoice</Text>
            </TouchableOpacity>
          </View>

          {order.deliveryNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Delivery Notes:</Text>
              <Text style={styles.notesText}>{order.deliveryNotes}</Text>
            </View>
          )}
        </View>

        {showTracking && order.trackingSteps && (
          <View style={styles.trackingContainer}>
            {order.trackingSteps.map((step: TrackingStep, index: number) => (
              <View key={index} style={styles.trackingStep}>
                <View style={styles.trackingLineContainer}>
                    <View style={[styles.trackingDot, step.completed && styles.trackingDotCompleted]} />
                    {index < order.trackingSteps!.length - 1 && <View style={[styles.trackingLine, step.completed && styles.trackingLineCompleted]} />}
                </View>
                <View style={styles.trackingContent}>
                  <Text style={[styles.trackingStepText, step.completed && styles.trackingStepCompleted]}>
                    {step.step}
                  </Text>
                  <Text style={styles.trackingTime}>{step.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                <ArrowLeft size={26} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Orders</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'current' ? (
          currentOrders.length > 0 ? (
            currentOrders.map(order => renderOrderCard(order, true))
          ) : (
            <View style={styles.emptyState}>
              <Package size={64} color={Colors.border} />
              <Text style={styles.emptyStateText}>No current orders</Text>
            </View>
          )
        ) : (
          orderHistory.length > 0 ? (
            orderHistory.map(order => renderOrderCard(order, false))
          ) : (
            <View style={styles.emptyState}>
              <Clock size={64} color={Colors.border} />
              <Text style={styles.emptyStateText}>No order history</Text>
            </View>
          )
        )}
      </ScrollView>

      {/* Invoice Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={invoiceVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setInvoiceVisible(false)}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.invoiceContainer]}>
                <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceTitle}>Invoice</Text>
                    <TouchableOpacity onPress={() => setInvoiceVisible(false)}>
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>
                {selectedOrder && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Customer Details */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Customer Details</Text>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Name:</Text><Text style={styles.invoiceValue}>{selectedOrder.customerName}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Phone:</Text><Text style={styles.invoiceValue}>{selectedOrder.customerPhone}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Address:</Text><Text style={[styles.invoiceValue, {textAlign: 'right', flex: 1}]}>{selectedOrder.deliveryAddress}</Text></View>
                        </View>

                        {/* Order Details */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Order Details</Text>
                            <View style={styles.invoiceRow}>
                              <Text style={styles.invoiceLabel}>Order Date:</Text>
                              <Text style={styles.invoiceValue}>
                                {new Date(selectedOrder.orderDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </Text>
                            </View>
                            {selectedOrder.expectedDelivery && (
                              <View style={styles.invoiceRow}>
                                <Text style={styles.invoiceLabel}>Expected Delivery:</Text>
                                <Text style={styles.invoiceValue}>
                                  {new Date(selectedOrder.expectedDelivery).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </Text>
                              </View>
                            )}
                            {selectedOrder.deliveryAgentName && (
                              <View style={styles.invoiceRow}>
                                <Text style={styles.invoiceLabel}>Delivery Agent:</Text>
                                <Text style={styles.invoiceValue}>{selectedOrder.deliveryAgentName}</Text>
                              </View>
                            )}
                        </View>

                        {/* Price Breakdown */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Price Breakdown</Text>
                            <View style={styles.itemHeader}>
                              <Text style={styles.itemHeaderText}>Item</Text>
                              <Text style={styles.itemHeaderText}>Amount</Text>
                            </View>
                            {selectedOrder.items.map((item, index) => (
                              <View key={index} style={styles.itemRow}>
                                <Text style={styles.invoiceItem}>
                                  {item.product.name} (x{item.quantity})
                                </Text>
                                <Text style={styles.invoiceItem}>
                                  ₹{item.product.price * item.quantity}
                                </Text>
                              </View>
                            ))}

                            {selectedOrder.discount > 0 && (
                              <View style={styles.itemRow}>
                                <Text style={styles.invoiceItem}>Discount</Text>
                                <Text style={styles.invoiceItem}>-₹{selectedOrder.discount}</Text>
                              </View>
                            )}
                            <View style={styles.invoiceDivider} />
                            <View style={styles.invoiceRow}>
                              <Text style={styles.invoiceTotalLabel}>Total Amount</Text>
                              <Text style={styles.invoiceTotalValue}>₹{selectedOrder.total}</Text>
                            </View>
                        </View>

                        {/* Payment Details */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Payment Details</Text>
                            <View style={styles.invoiceRow}>
                              <Text style={styles.invoiceLabel}>Payment Mode:</Text>
                              <Text style={styles.invoiceValue}>{selectedOrder.paymentMethod}</Text>
                            </View>
                        </View>

                        {/* Delivery Notes */}
                        {selectedOrder.deliveryNotes && (
                            <View style={styles.invoiceSection}>
                                <Text style={styles.invoiceSectionTitle}>Delivery Notes</Text>
                                <View style={styles.invoiceRow}>
                                  <Text style={styles.invoiceLabel}>Notes:</Text>
                                  <Text style={[styles.invoiceValue, {textAlign: 'right', flex: 1}]}>{selectedOrder.deliveryNotes}</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  tab: {
    flex: 1,
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.primaryLighter,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 15,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  status: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  trackingContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  trackingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trackingLineContainer: {
      alignItems: 'center',
      marginRight: 16,
  },
  trackingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  trackingDotCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  trackingLine: {
      flex: 1,
      width: 2,
      backgroundColor: Colors.border,
      minHeight: 30,
  },
  trackingLineCompleted: {
      backgroundColor: Colors.primary,
  },
  trackingContent: {
    flex: 1,
    paddingBottom: 24,
  },
  trackingStepText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  trackingStepCompleted: {
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
  trackingTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  // --- Invoice Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical:34,
    paddingHorizontal:26,
    width: '90%',
    height: '90%',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  invoiceSection: {
    marginBottom: 20,
  },
  invoiceSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  invoiceLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  invoiceValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    flexShrink: 1,
  },
  invoiceAddress: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: Colors.text,
      lineHeight: 22,
  },
  itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderColor: Colors.border,
  },
  itemHeaderText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.textSecondary,
  },
  itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: Colors.border,
  },
  invoiceItem: {
      fontSize: 15,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  invoiceTotalSection: {
      paddingTop: 16,
  },
  invoiceDivider: {
      height: 1,
      backgroundColor: Colors.border,
      marginVertical: 12,
  },
  invoiceTotalLabel: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
  },
  invoiceTotalValue: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: Colors.primary,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 20,
  }
});