import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle, MapPin, Package, Phone, RefreshCw, Truck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { OrderData, orderService } from '../../core/services/orderService';

// Navigation type
interface DeliveryOrdersScreenProps {
  navigation: any;
}

// --- Red Color Palette ---
const Colors = {
  primary: '#DC2626', // A modern, strong red
  primaryLight: '#F87171',
  primaryLighter: '#FEE2E2',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  yellow: '#F59E0B',
  blue: '#3B82F6',
  green: '#16A34A',
};

export default function DeliveryOrdersScreen({ navigation }: DeliveryOrdersScreenProps) {
  const insets = useSafeAreaInsets();
  const { userSession } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Fetch orders assigned to this delivery agent
  const fetchAssignedOrders = async (isRefresh = false) => {
    if (!userSession?.uid) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const assignedOrders = await orderService.getOrdersByDeliveryAgent(userSession.uid);
      setOrders(assignedOrders);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      Alert.alert('Error', 'Failed to load assigned orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
  }, [userSession?.uid]);

  const assignedOrders = orders.filter(o => 
    o.orderStatus === 'confirmed' || o.orderStatus === 'out_for_delivery'
  );
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered');

  const getStatusColor = (status: OrderData['orderStatus']) => {
    switch (status) {
      case 'delivered': return Colors.green;
      case 'out_for_delivery': return Colors.blue;
      case 'confirmed': return Colors.yellow;
      case 'pending': return Colors.textSecondary;
      case 'cancelled': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusDisplayText = (status: OrderData['orderStatus']) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'out_for_delivery': return 'On the Way';
      case 'confirmed': return 'Assigned';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderData['orderStatus']) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );

      Alert.alert('Success', `Order status updated to ${getStatusDisplayText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderOrderCard = (order: OrderData, showActions = true) => {
    const statusColor = getStatusColor(order.orderStatus);
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
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusDisplayText(order.orderStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>
            {firstItem ? `${firstItem.product.name} (Qty: ${firstItem.quantity})` : 'No items'}
          </Text>
          <Text style={styles.amount}>₹{order.total}</Text>
        </View>

        <View style={styles.addressContainer}>
          <MapPin size={16} color={Colors.textSecondary} />
          <Text style={styles.address}>{order.deliveryAddress}</Text>
        </View>

        <View style={styles.contactContainer}>
          <Phone size={16} color={Colors.textSecondary} />
          <Text style={styles.phone}>{order.customerPhone}</Text>
          <Text style={styles.orderDate}>{orderDate}</Text>
        </View>

        {showActions && (
          <View style={styles.orderActions}>
            {order.orderStatus === 'confirmed' && (
              <TouchableOpacity 
                style={[styles.actionButton, {backgroundColor: Colors.yellow}]}
                onPress={() => handleStatusUpdate(order.id!, 'out_for_delivery')}
              >
                <Truck size={16} color={Colors.white} />
                <Text style={styles.actionButtonText}>Start Delivery</Text>
              </TouchableOpacity>
            )}
            {order.orderStatus === 'out_for_delivery' && (
              <TouchableOpacity 
                style={[styles.actionButton, {backgroundColor: Colors.primary}]}
                onPress={() => handleStatusUpdate(order.id!, 'delivered')}
              >
                <CheckCircle size={16} color={Colors.white} />
                <Text style={styles.actionButtonText}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[Colors.primaryLight, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerIcon}>
                <ArrowLeft size={26} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Deliveries</Text>
        </View>
        <TouchableOpacity 
          onPress={() => fetchAssignedOrders(true)} 
          style={styles.headerIcon}
          disabled={refreshing}
        >
          <RefreshCw size={24} color={Colors.white} style={refreshing ? {opacity: 0.5} : {}} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assigned' && styles.activeTab]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
            Assigned ({assignedOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'assigned' ? (
          assignedOrders.length > 0 ? (
            assignedOrders.map(order => renderOrderCard(order, true))
          ) : (
            <View style={styles.emptyState}>
              <Package size={64} color={Colors.border} />
              <Text style={styles.emptyStateText}>No assigned orders</Text>
              <Text style={styles.emptyStateSubtext}>Orders assigned to you will appear here</Text>
            </View>
          )
        ) : (
          completedOrders.length > 0 ? (
            completedOrders.map(order => renderOrderCard(order, false))
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle size={64} color={Colors.border} />
              <Text style={styles.emptyStateText}>No completed orders</Text>
              <Text style={styles.emptyStateSubtext}>Your delivered orders will appear here</Text>
            </View>
          )
        )}
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
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.blue,
    fontFamily: 'Inter_600SemiBold',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
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
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});