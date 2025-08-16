import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Plus, Search, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeliveryAgent, deliveryAgentService } from '../../core/services/deliveryAgentService';
import { OrderData, orderService } from '../../core/services/orderService';
import { Product, getProducts } from '../../core/services/productService';

// Navigation type
interface AdminOrdersScreenProps {
  navigation: any;
}

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
};

export default function AdminOrdersScreen({ navigation }: AdminOrdersScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeMainTab, setActiveMainTab] = useState('active');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderData, setNewOrderData] = useState({
      customerName: '',
      phone: '',
      address: '',
      product: null as Product | null,
      quantity: '1',
  });

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  
  // Fetch orders, delivery agents, and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, agentsData, productsData] = await Promise.all([
          orderService.getAllOrders(),
          deliveryAgentService.getAllDeliveryAgents(),
          getProducts()
        ]);
        setOrders(ordersData);
        setDeliveryAgents(agentsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mock data removed - using real Firebase data

  const activeOrders = orders.filter(o => 
    o.orderStatus === 'pending' || 
    o.orderStatus === 'confirmed' || 
    o.orderStatus === 'out_for_delivery'
  );
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered');

  const filters = [
    { key: 'all', label: 'All Active', count: activeOrders.length },
    { key: 'pending', label: 'Pending', count: activeOrders.filter(o => o.orderStatus === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: activeOrders.filter(o => o.orderStatus === 'confirmed').length },
    { key: 'delivery', label: 'Out for Delivery', count: activeOrders.filter(o => o.orderStatus === 'out_for_delivery').length },
  ];

  const getStatusColor = (status: OrderData['orderStatus']) => {
    switch (status) {
      case 'delivered': return Colors.green;
      case 'out_for_delivery': return Colors.primary;
      case 'confirmed': return Colors.primaryLight;
      case 'pending': return Colors.yellow;
      case 'cancelled': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const handleOrderPress = (order: OrderData) => {
      setSelectedOrder(order);
      setSelectedAgent(order.deliveryAgentId || null);
      setDetailModalVisible(true);
  }

  const handleOrderLongPress = (order: OrderData) => {
      if (order.orderStatus === 'pending') {
          setSelectedOrders(prevSelected => 
              prevSelected.includes(order.id!)
                  ? prevSelected.filter(id => id !== order.id)
                  : [...prevSelected, order.id!]
          );
      }
  }

  const handleBulkAssignPress = () => {
      setSelectedOrder({ 
          id: 'multiple',
          customerName: `${selectedOrders.length} orders selected`,
          orderStatus: 'pending',
      } as OrderData);
      setSelectedAgent(null);
      setDetailModalVisible(true);
  }
  
  const handleAssignDeliveryAgent = async (orderId: string, agentId: string, agentName: string) => {
    try {
      await orderService.assignDeliveryAgent(orderId, agentId, agentName);
      // Refresh orders
      const updatedOrders = await orderService.getAllOrders();
      setOrders(updatedOrders);
      setDetailModalVisible(false);
      Alert.alert('Success', 'Delivery agent assigned successfully');
    } catch (error) {
      console.error('Error assigning delivery agent:', error);
      Alert.alert('Error', 'Failed to assign delivery agent');
    }
  }

  const handleBulkAssignment = async () => {
    if (!selectedAgent) {
      Alert.alert('Error', 'Please select a delivery agent');
      return;
    }

    const agent = deliveryAgents.find(a => a.id === selectedAgent);
    if (!agent) return;

    try {
      await Promise.all(
        selectedOrders.map(orderId => 
          orderService.assignDeliveryAgent(orderId, agent.id!, agent.name)
        )
      );

      // Refresh orders
      const updatedOrders = await orderService.getAllOrders();
      setOrders(updatedOrders);
      setSelectedOrders([]);
      setDetailModalVisible(false);
      Alert.alert('Success', 'Orders assigned successfully');
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      Alert.alert('Error', 'Failed to assign orders');
    }
  }
  
  const handleCreateOrder = async () => {
    try {
      if (!newOrderData.product) {
        Alert.alert('Error', 'Please select a product');
        return;
      }

      const orderData = {
        userId: 'admin-created', // Special case for admin-created orders
        customerName: newOrderData.customerName,
        customerPhone: newOrderData.phone,
        deliveryAddress: newOrderData.address,
        items: [{
          productId: newOrderData.product.id!,
          userId: 'admin-created',
          product: newOrderData.product,
          quantity: parseInt(newOrderData.quantity),
        }],
        subtotal: newOrderData.product.price * parseInt(newOrderData.quantity),
        deliveryCharge: newOrderData.product.deliveryCharge || 0,
        gst: 0, // Add GST calculation if needed
        discount: 0,
        total: (newOrderData.product.price * parseInt(newOrderData.quantity)) + (newOrderData.product.deliveryCharge || 0),
        paymentMethod: 'cod' as const,
      };

      await orderService.createOrder(orderData);
      
      // Refresh orders
      const updatedOrders = await orderService.getAllOrders();
      setOrders(updatedOrders);
      
      setCreateModalVisible(false);
      // Reset form
      setNewOrderData({ customerName: '', phone: '', address: '', product: null, quantity: '1' });
      Alert.alert('Success', 'Order created successfully');
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order');
    }
  }

  const filteredActiveOrders = selectedFilter === 'all' ? activeOrders : 
    activeOrders.filter(order => {
      switch (selectedFilter) {
        case 'pending': return order.orderStatus === 'pending';
        case 'confirmed': return order.orderStatus === 'confirmed';
        case 'delivery': return order.orderStatus === 'out_for_delivery';
        default: return true;
      }
    });

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderOrderList = (orderList: OrderData[]) => (
    orderList.map((order) => {
        const isSelected = order.id && selectedOrders.includes(order.id);
        const firstItem = order.items[0]; // Get first item for display
        const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        
        return (
        <TouchableOpacity 
            key={order.id} 
            style={[
              styles.orderCard, 
              isSelected && styles.orderCardSelected, 
              order.orderStatus === 'delivered' && styles.completedOrderCard
            ]} 
            onPress={() => handleOrderPress(order)}
            onLongPress={() => handleOrderLongPress(order)}
        >
          {isSelected && <View style={styles.selectionIndicator}><Check size={14} color={Colors.white} /></View>}
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.orderDate}>{orderDate}</Text>
            </View>
            <Text style={styles.orderAmount}>₹{order.total}</Text>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.productName}>
              {firstItem ? `${firstItem.product.name} (x${firstItem.quantity})` : 'No items'}
            </Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.customerAddress}>{order.deliveryAddress}</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.deliveryPerson}>
                {order.deliveryAgentName ? `Assigned to: ${order.deliveryAgentName}` : 'Unassigned'}
            </Text>
            <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
              {order.orderStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </TouchableOpacity>
        )
    })
  );

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
            <Text style={styles.headerTitle}>Order Management</Text>
        </View>
        <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.headerIcon}>
            <Plus size={26} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by Order ID or Customer"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.mainTabContainer}>
          <TouchableOpacity style={[styles.mainTab, activeMainTab === 'active' && styles.activeMainTab]} onPress={() => setActiveMainTab('active')}>
              <Text style={[styles.mainTabText, activeMainTab === 'active' && styles.activeMainTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mainTab, activeMainTab === 'completed' && styles.activeMainTab]} onPress={() => setActiveMainTab('completed')}>
              <Text style={[styles.mainTabText, activeMainTab === 'completed' && styles.activeMainTabText]}>Completed</Text>
          </TouchableOpacity>
      </View>

      {activeMainTab === 'active' && (
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                {filters.map((filter) => (
                <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterChip, selectedFilter === filter.key && styles.activeFilterChip]}
                    onPress={() => setSelectedFilter(filter.key)}
                >
                    <Text style={[styles.filterText, selectedFilter === filter.key && styles.activeFilterText]}>
                    {filter.label}
                    </Text>
                    <Text style={[styles.filterCount, selectedFilter === filter.key && styles.activeFilterCount]}>
                    {filter.count}
                    </Text>
                </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.ordersList}>
        {activeMainTab === 'active' ? renderOrderList(filteredActiveOrders) : renderOrderList(completedOrders)}
      </ScrollView>

      {/* Bulk Assign Footer */}
      {selectedOrders.length > 0 && (
          <View style={[styles.modalFooter, {paddingBottom: insets.bottom + 10}]}>
              <Text style={styles.assignButtonText}>{selectedOrders.length} Order(s) Selected</Text>
              <TouchableOpacity style={styles.assignButton} onPress={handleBulkAssignPress}>
                  <Text style={styles.assignButtonText}>Assign Agent</Text>
              </TouchableOpacity>
          </View>
      )}

      {/* Order Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, {paddingBottom: insets.bottom}]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Order Details</Text>
                    <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                        <X size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                {selectedOrder && (
                    <ScrollView>
                        {selectedOrder.id !== 'multiple' && (
                            <>
                            <View style={styles.modalSection}>
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Order ID:</Text><Text style={styles.modalValue}>#{selectedOrder.id}</Text></View>
                                <View style={styles.modalRow}>
                                  <Text style={styles.modalLabel}>Products:</Text>
                                  <View style={{flex: 1, alignItems: 'flex-end'}}>
                                    {selectedOrder.items.map((item, index) => (
                                      <Text key={index} style={styles.modalValue}>
                                        {item.product.name} (x{item.quantity}) - ₹{item.product.price * item.quantity}
                                      </Text>
                                    ))}
                                  </View>
                                </View>
                                <View style={styles.modalRow}>
                                  <Text style={styles.modalLabel}>Order Date:</Text>
                                  <Text style={styles.modalValue}>
                                    {new Date(selectedOrder.orderDate).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </Text>
                                </View>
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Subtotal:</Text><Text style={styles.modalValue}>₹{selectedOrder.subtotal}</Text></View>
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Delivery Charge:</Text><Text style={styles.modalValue}>₹{selectedOrder.deliveryCharge}</Text></View>
                                {selectedOrder.discount > 0 && (
                                  <View style={styles.modalRow}><Text style={styles.modalLabel}>Discount:</Text><Text style={styles.modalValue}>₹{selectedOrder.discount}</Text></View>
                                )}
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Total Amount:</Text><Text style={[styles.modalValue, {fontFamily: 'Inter_700Bold'}]}>₹{selectedOrder.total}</Text></View>
                            </View>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Customer Info</Text>
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Name:</Text><Text style={styles.modalValue}>{selectedOrder.customerName}</Text></View>
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Phone:</Text><Text style={styles.modalValue}>{selectedOrder.customerPhone}</Text></View>
                                <View style={styles.modalRow}><Text style={styles.modalLabel}>Address:</Text><Text style={[styles.modalValue, {textAlign: 'right', flex: 1}]}>{selectedOrder.deliveryAddress}</Text></View>
                            </View>
                            </>
                        )}
                        
                        {selectedOrder.orderStatus === 'delivered' && (
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Delivery Details</Text>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Delivered by:</Text>
                                    <Text style={styles.modalValue}>{selectedOrder.deliveryAgentName}</Text>
                                </View>
                            </View>
                        )}

                        {(selectedOrder.orderStatus === 'pending' || selectedOrder.orderStatus === 'out_for_delivery' || selectedOrder.id === 'multiple') && (
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>
                                    {selectedOrder.id === 'multiple' ? `Assign Agent to ${selectedOrders.length} Orders` : 'Assign Delivery Agent'}
                                </Text>
                                {deliveryAgents.map(agent => (
                                    <TouchableOpacity key={agent.id} style={styles.agentRow} onPress={() => setSelectedAgent(agent.id || null)}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                            <User size={18} color={Colors.textSecondary} />
                                            <Text style={styles.agentName}>{agent.name}</Text>
                                        </View>
                                        <View style={[styles.radioOuter, selectedAgent === agent.id && styles.radioSelected]}>
                                            {selectedAgent === agent.id && <View style={styles.radioInner}/>}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
                {(selectedOrder?.orderStatus === 'pending' || 
                  selectedOrder?.orderStatus === 'confirmed' || 
                  selectedOrder?.orderStatus === 'out_for_delivery' || 
                  selectedOrder?.id === 'multiple') && (
                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                          style={[styles.assignButton, !selectedAgent && styles.assignButtonDisabled]}
                          onPress={() => {
                            if (!selectedAgent) {
                              Alert.alert('Error', 'Please select a delivery agent');
                              return;
                            }
                            const agent = deliveryAgents.find(a => a.id === selectedAgent);
                            if (!agent) return;

                            if (selectedOrder.id === 'multiple') {
                              handleBulkAssignment();
                            } else if (selectedOrder.id) {
                              handleAssignDeliveryAgent(selectedOrder.id, agent.id!, agent.name);
                            }
                          }}
                        >
                            <Text style={styles.assignButtonText}>
                                {selectedOrder?.orderStatus === 'out_for_delivery' 
                                  ? 'Update Assignment' 
                                  : selectedOrder?.id === 'multiple'
                                  ? 'Assign to Selected Orders'
                                  : 'Confirm Assignment'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
      </Modal>

      {/* Create Order Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, {paddingBottom: insets.bottom}]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Create New Order</Text>
                    <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                        <X size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    <View style={styles.modalForm}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Customer Name</Text>
                            <TextInput style={styles.input} value={newOrderData.customerName} onChangeText={text => setNewOrderData({...newOrderData, customerName: text})} placeholder="Enter customer name" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput style={styles.input} value={newOrderData.phone} onChangeText={text => setNewOrderData({...newOrderData, phone: text})} placeholder="Enter phone number" keyboardType="phone-pad" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Delivery Address</Text>
                            <TextInput style={[styles.input, {height: 80}]} value={newOrderData.address} onChangeText={text => setNewOrderData({...newOrderData, address: text})} placeholder="Enter full address" multiline />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Select Product</Text>
                            {products.map(product => (
                                <TouchableOpacity key={product.id} style={[styles.productOption, newOrderData.product?.id === product.id && styles.productOptionSelected]} onPress={() => setNewOrderData({...newOrderData, product})}>
                                    <Text style={[styles.productOptionText, newOrderData.product?.id === product.id && styles.productOptionTextSelected]}>{product.name}</Text>
                                    <Text style={[styles.productOptionPrice, newOrderData.product?.id === product.id && styles.productOptionTextSelected]}>₹{product.price}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.assignButton} onPress={handleCreateOrder}>
                        <Text style={styles.assignButtonText}>Create Order</Text>
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
    paddingBottom: 10,
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
  mainTabContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderColor: Colors.border,
  },
  mainTab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
  },
  activeMainTab: {
      borderBottomColor: Colors.primary,
  },
  mainTabText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
  },
  activeMainTabText: {
      color: Colors.primary,
      fontFamily: 'Inter_600SemiBold',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterChip: {
    backgroundColor: Colors.primaryLighter,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  filterCount: {
      marginLeft: 8,
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.textSecondary,
      backgroundColor: Colors.border,
      paddingHorizontal: 6,
      borderRadius: 8,
  },
  activeFilterCount: {
      color: Colors.primary,
      backgroundColor: Colors.white,
  },
  ordersList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 16,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderCardSelected: {
      borderColor: Colors.primary,
  },
  completedOrderCard: {
      opacity: 0.8,
  },
  selectionIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  customerInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
  },
  deliveryPerson: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  // --- Modal Styles ---
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContainer: {
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
      borderColor: Colors.border,
  },
  modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
  },
  modalForm: {
      padding: 20,
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
  productOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 12,
  },
  productOptionSelected: {
      backgroundColor: Colors.primaryLighter,
      borderColor: Colors.primary,
  },
  productOptionText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  productOptionTextSelected: {
      fontFamily: 'Inter_600SemiBold',
      color: Colors.primary,
  },
  productOptionPrice: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
  },
  modalSection: {
      padding: 20,
  },
  modalSectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      marginBottom: 12,
  },
  modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
  },
  modalLabel: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
  },
  modalValue: {
      fontSize: 15,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  agentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  agentName: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
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
  modalFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  assignButton: {
      backgroundColor: Colors.primary,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      flex: 1,
  },
  assignButtonDisabled: {
      backgroundColor: Colors.textSecondary,
      opacity: 0.7,
  },
  assignButtonText: {
      color: Colors.white,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
  }
});