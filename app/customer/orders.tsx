import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, Package, Truck, X } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
};

// --- Mock Order Data ---
const currentOrders = [
    {
      id: 'ORD001',
      product: 'HP Gas 14.2kg',
      quantity: 1,
      basePrice: 807.5,
      gst: 42.5,
      deliveryCharge: 30,
      total: 880,
      status: 'Out for Delivery',
      orderedOn: '20 July 2025',
      expectedDelivery: '20 July 2025',
      paymentMode: 'Credit Card',
      address: '123 Main Street, Apartment 4B, City - 400001',
      customerName: 'Alpen Bhai',
      lpgId: '1234567890',
      mobileNumber: '+91 98765 43210',
      bookingRef: 'BKNGREF12345',
      distributorName: 'Anil Gas Agency',
      distributorCode: 'D-VAD-101',
      transactionId: 'TXN123456789',
      paymentStatus: 'Paid',
      paymentDate: '20 July 2025, 10:31 AM',
      distributorContact: '+91 265 234 5678',
      helplineNumber: '1800-2333-555',
      trackingSteps: [
        { step: 'Order Placed', completed: true, time: '10:30 AM' },
        { step: 'Confirmed', completed: true, time: '10:45 AM' },
        { step: 'Out for Delivery', completed: true, time: '2:00 PM' },
        { step: 'Delivered', completed: false, time: 'Expected by 4:00 PM' },
      ],
    },
    {
      id: 'ORD002',
      product: 'HP Gas 5kg',
      quantity: 2,
      basePrice: 450,
      gst: 22.5,
      deliveryCharge: 40,
      total: 962.5,
      status: 'Confirmed',
      orderedOn: '20 July 2025',
      expectedDelivery: '21 July 2025',
      paymentMode: 'Cash on Delivery',
      address: '456 Oak Avenue, House 12, City - 400002',
      customerName: 'Alpen Bhai',
      lpgId: '1234567890',
      mobileNumber: '+91 98765 43210',
      bookingRef: 'BKNGREF12346',
      distributorName: 'Anil Gas Agency',
      distributorCode: 'D-VAD-101',
      transactionId: 'N/A',
      paymentStatus: 'Pending',
      paymentDate: 'N/A',
      distributorContact: '+91 265 234 5678',
      helplineNumber: '1800-2333-555',
      trackingSteps: [
        { step: 'Order Placed', completed: true, time: '11:00 AM' },
        { step: 'Confirmed', completed: true, time: '11:15 AM' },
        { step: 'Out for Delivery', completed: false, time: 'Tomorrow' },
        { step: 'Delivered', completed: false, time: '' },
      ],
    },
];

const orderHistory = [
    {
      id: 'ORD000',
      product: 'HP Gas 14.2kg',
      quantity: 1,
      basePrice: 807.5,
      gst: 42.5,
      deliveryCharge: 30,
      total: 880,
      status: 'Delivered',
      orderedOn: '15 July 2025',
      deliveredOn: '15 July 2025',
      paymentMode: 'Credit Card',
      address: '123 Main Street, Apartment 4B, City - 400001',
      customerName: 'Alpen Bhai',
      lpgId: '1234567890',
      mobileNumber: '+91 98765 43210',
      bookingRef: 'BKNGREF12344',
      distributorName: 'Anil Gas Agency',
      distributorCode: 'D-VAD-101',
      transactionId: 'TXN0987654321',
      paymentStatus: 'Paid',
      paymentDate: '15 July 2025, 09:15 AM',
      distributorContact: '+91 265 234 5678',
      helplineNumber: '1800-2333-555',
    },
];

const getStatusInfo = (status) => {
    switch (status) {
      case 'Delivered':
        return { Icon: CheckCircle, color: Colors.green };
      case 'Out for Delivery':
        return { Icon: Truck, color: Colors.primary };
      case 'Confirmed':
        return { Icon: Package, color: Colors.yellow };
      default:
        return { Icon: Clock, color: Colors.textSecondary };
    }
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('current');
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setInvoiceVisible(true);
  };

  const renderOrderCard = (order, showTracking = false) => {
    const { Icon, color } = getStatusInfo(order.status);

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={styles.productName}>{order.product} (x{order.quantity})</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: `${color}1A` }]}>
            <Icon size={16} color={color} />
            <Text style={[styles.status, { color: color }]}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          {order.orderedOn && (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ordered on:</Text>
                <Text style={styles.detailValue}>{order.orderedOn}</Text>
            </View>
          )}
          {order.expectedDelivery && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected delivery:</Text>
              <Text style={styles.detailValue}>{order.expectedDelivery}</Text>
            </View>
          )}
          {order.deliveredOn && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivered on:</Text>
              <Text style={styles.detailValue}>{order.deliveredOn}</Text>
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
        </View>

        {showTracking && order.trackingSteps && (
          <View style={styles.trackingContainer}>
            {order.trackingSteps.map((step, index) => (
              <View key={index} style={styles.trackingStep}>
                <View style={styles.trackingLineContainer}>
                    <View style={[styles.trackingDot, step.completed && styles.trackingDotCompleted]} />
                    {index < order.trackingSteps.length - 1 && <View style={[styles.trackingLine, step.completed && styles.trackingLineCompleted]} />}
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
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>LPG ID:</Text><Text style={styles.invoiceValue}>{selectedOrder.lpgId}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Mobile:</Text><Text style={styles.invoiceValue}>{selectedOrder.mobileNumber}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Address:</Text><Text style={[styles.invoiceValue, {textAlign: 'right', flex: 1}]}>{selectedOrder.address}</Text></View>
                        </View>

                        {/* Booking Details */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Booking Details</Text>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Booking Date:</Text><Text style={styles.invoiceValue}>{selectedOrder.orderedOn}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Delivery Date:</Text><Text style={styles.invoiceValue}>{selectedOrder.deliveredOn || selectedOrder.expectedDelivery}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Booking Ref No:</Text><Text style={styles.invoiceValue}>{selectedOrder.bookingRef}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Distributor:</Text><Text style={styles.invoiceValue}>{selectedOrder.distributorName} ({selectedOrder.distributorCode})</Text></View>
                        </View>

                        {/* Price Breakdown */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Price Breakdown</Text>
                            <View style={styles.itemHeader}><Text style={styles.itemHeaderText}>Item</Text><Text style={styles.itemHeaderText}>Amount</Text></View>
                            <View style={styles.itemRow}><Text style={styles.invoiceItem}>{selectedOrder.product} (x{selectedOrder.quantity})</Text><Text style={styles.invoiceItem}>₹{selectedOrder.basePrice * selectedOrder.quantity}</Text></View>
                            <View style={styles.itemRow}><Text style={styles.invoiceItem}>GST</Text><Text style={styles.invoiceItem}>₹{selectedOrder.gst}</Text></View>
                            <View style={styles.itemRow}><Text style={styles.invoiceItem}>Delivery Charge</Text><Text style={styles.invoiceItem}>₹{selectedOrder.deliveryCharge}</Text></View>
                            <View style={styles.invoiceDivider} />
                            <View style={styles.invoiceRow}><Text style={styles.invoiceTotalLabel}>Total Amount</Text><Text style={styles.invoiceTotalValue}>₹{selectedOrder.total}</Text></View>
                        </View>

                        {/* Payment Details */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Payment Details</Text>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Payment Mode:</Text><Text style={styles.invoiceValue}>{selectedOrder.paymentMode}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Transaction ID:</Text><Text style={styles.invoiceValue}>{selectedOrder.transactionId}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Payment Status:</Text><Text style={[styles.invoiceValue, {color: selectedOrder.paymentStatus === 'Paid' ? Colors.green : Colors.yellow}]}>{selectedOrder.paymentStatus}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Date of Payment:</Text><Text style={styles.invoiceValue}>{selectedOrder.paymentDate}</Text></View>
                        </View>

                        {/* Other Information */}
                        <View style={styles.invoiceSection}>
                            <Text style={styles.invoiceSectionTitle}>Other Information</Text>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Distributor Contact:</Text><Text style={styles.invoiceValue}>{selectedOrder.distributorContact}</Text></View>
                            <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Consumer Helpline:</Text><Text style={styles.invoiceValue}>{selectedOrder.helplineNumber}</Text></View>
                        </View>
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
  }
});