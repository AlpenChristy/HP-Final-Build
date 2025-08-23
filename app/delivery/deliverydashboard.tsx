import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Clock, Package, BarChart2 as TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { orderService } from '../../core/services/orderService';

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
  green: '#16A34A',
};

export default function DeliverySummaryScreen() {
  const insets = useSafeAreaInsets();
  const { userSession } = useAuth();
  
  const [todayStats, setTodayStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    earnings: 0,
  });
  
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load delivery data
  useEffect(() => {
    if (userSession?.uid) {
      loadDeliveryData();
    }
  }, [userSession?.uid]);

  const loadDeliveryData = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      console.log('Today date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
      
      // Get all orders and filter by delivery agent
      let agentOrders = await orderService.getOrdersByDeliveryAgent(userSession.uid);
      
      // If no orders found, try getting all orders and filtering manually
      if (agentOrders.length === 0) {
        console.log('No orders found with delivery agent query, trying manual filter...');
        const allOrders = await orderService.getAllOrders();
        agentOrders = allOrders.filter(order => order.deliveryAgentId === userSession.uid);
        console.log('Manual filter found:', agentOrders.length, 'orders');
      }
      
      console.log('All agent orders:', agentOrders.length);
      console.log('Agent UID:', userSession.uid);
      
      // Filter today's orders - check both orderDate and deliveredAt for today's deliveries
      const todayOrders = agentOrders.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : null;
        
        // Include orders that were either placed today OR delivered today
        const isOrderedToday = orderDate >= startOfDay && orderDate <= endOfDay;
        const isDeliveredToday = deliveredDate && deliveredDate >= startOfDay && deliveredDate <= endOfDay;
        
        return isOrderedToday || isDeliveredToday;
      });
      
      console.log('Today orders:', todayOrders.length);
      
      // Calculate stats
      const totalDeliveries = todayOrders.length;
      const completedDeliveries = todayOrders.filter(order => order.orderStatus === 'delivered').length;
      const pendingDeliveries = todayOrders.filter(order => 
        order.orderStatus === 'pending' || 
        order.orderStatus === 'confirmed' || 
        order.orderStatus === 'out_for_delivery'
      ).length;
      
      // Calculate total value of delivered products TODAY only
      const todayCompletedOrders = todayOrders.filter(order => order.orderStatus === 'delivered');
      console.log('Today completed orders for total value:', todayCompletedOrders.length);
      
      const earnings = todayCompletedOrders.reduce((total, order) => {
        console.log(`Today's Order ${order.orderId || order.id}: Total value ₹${order.total}`);
        return total + order.total;
      }, 0);
      
      console.log('Total value of TODAY\'s delivered products:', earnings);
      
      // If no today's orders found, show all-time stats as fallback
      if (totalDeliveries === 0) {
        console.log('No today\'s orders found, showing all-time stats as fallback');
        const allTimeCompleted = agentOrders.filter(order => order.orderStatus === 'delivered').length;
        const allTimePending = agentOrders.filter(order => 
          order.orderStatus === 'pending' || 
          order.orderStatus === 'confirmed' || 
          order.orderStatus === 'out_for_delivery'
        ).length;
        const allTimeEarnings = agentOrders
          .filter(order => order.orderStatus === 'delivered')
          .reduce((total, order) => total + order.total, 0);
        
        setTodayStats({
          totalDeliveries: agentOrders.length,
          completedDeliveries: allTimeCompleted,
          pendingDeliveries: allTimePending,
          earnings: allTimeEarnings,
        });
      } else {
        setTodayStats({
          totalDeliveries,
          completedDeliveries,
          pendingDeliveries,
          earnings,
        });
      }
      
      // Get recent deliveries (last 5 completed orders)
      const recentCompletedOrders = agentOrders
        .filter(order => order.orderStatus === 'delivered')
        .sort((a, b) => (b.deliveredAt || b.createdAt) - (a.deliveredAt || a.createdAt))
        .slice(0, 5)
        .map(order => {
          const deliveryDate = new Date(order.deliveredAt || order.createdAt);
          return {
            id: order.orderId || order.id,
            customer: order.customerName,
            time: deliveryDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            date: deliveryDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            orderTotal: order.total, // Show actual order total
            items: order.items, // Include items for product details
          };
        });
      
      setRecentDeliveries(recentCompletedOrders);
      
      // Log final stats for debugging
      console.log('Final stats:', {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        earnings,
        recentDeliveriesCount: recentCompletedOrders.length
      });
      
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading delivery data...</Text>
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
        <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Delivery Dashboard</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Performance</Text>
            <View style={styles.statsGrid}>
                <View style={styles.statCard}><View style={styles.statIconContainer}><Package size={24} color={Colors.primary} /></View><Text style={styles.statValue}>{todayStats.totalDeliveries}</Text><Text style={styles.statLabel}>Total Orders</Text></View>
                <View style={styles.statCard}><View style={styles.statIconContainer}><CheckCircle size={24} color={Colors.primary} /></View><Text style={styles.statValue}>{todayStats.completedDeliveries}</Text><Text style={styles.statLabel}>Completed</Text></View>
                <View style={styles.statCard}><View style={styles.statIconContainer}><Clock size={24} color={Colors.primary} /></View><Text style={styles.statValue}>{todayStats.pendingDeliveries}</Text><Text style={styles.statLabel}>Pending</Text></View>
                <View style={styles.statCard}><View style={styles.statIconContainer}><TrendingUp size={24} color={Colors.primary} /></View><Text style={styles.earningsValue}>₹{todayStats.earnings}</Text><Text style={styles.statLabel}>Total Value</Text></View>
            </View>
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                <TouchableOpacity onPress={loadDeliveryData}>
                    <Text style={styles.viewAllText}>Refresh</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.deliveryListContainer}>
                {recentDeliveries.length > 0 ? (
                    recentDeliveries.map((delivery, index) => (
                    <View key={delivery.id} style={[styles.deliveryCard, index === recentDeliveries.length - 1 && {borderBottomWidth: 0}]}>
                        <View style={[styles.statIconContainer, {marginRight: 16}]}>
                            <Package size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.deliveryInfo}>
                        <Text style={styles.deliveryCustomer}>{delivery.customer}</Text>
                        <Text style={styles.deliveryTime}>Delivered at {delivery.time} • {delivery.date}</Text>
                        <Text style={styles.deliveryItems}>
                          {delivery.items?.length || 0} items • {delivery.items?.[0]?.productName || 'Products'}
                        </Text>
                        </View>
                        <View style={styles.deliveryRight}>
                        <Text style={styles.deliveryEarnings}>₹{delivery.orderTotal}</Text>
                        </View>
                    </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Package size={48} color={Colors.textSecondary} />
                        <Text style={styles.emptyStateText}>No deliveries yet</Text>
                        <Text style={styles.emptyStateSubtext}>Completed deliveries will appear here</Text>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Colors.background 
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 12,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.primaryLighter,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  earningsValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  deliveryListContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryCustomer: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  deliveryTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  deliveryItems: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  deliveryRight: {
    alignItems: 'flex-end',
  },
  deliveryEarnings: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
