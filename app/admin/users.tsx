import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, Search, Trash2, User, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../../components/ui/Toast';
import { useAdminNavigation } from '../../core/auth/AdminNavigationContext';
import { useAuth } from '../../core/auth/AuthContext';
import { orderService } from '../../core/services/orderService';
import { userService } from '../../core/services/userService';

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
  yellow: '#F59E0B',
};

interface CustomerUser {
  uid: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  consumerNumber?: string;
  createdAt: number;
  lastLoginAt?: number;
  isActive: boolean;
  totalOrders: number;
}

export default function CustomerUsersScreen() {
  const insets = useSafeAreaInsets();
  const { goBack } = useAdminNavigation();
  const { userSession } = useAuth();
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  
  // Delete customer modal state
  const [deleteCustomerModalVisible, setDeleteCustomerModalVisible] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerUser | null>(null);

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    if (userSession?.uid) {
      loadCustomers();
    }
  }, [userSession?.uid]);

  useEffect(() => {
    // Filter customers based on search query
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber?.includes(searchQuery) ||
        customer.consumerNumber?.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    if (!userSession?.uid) return;

    setIsLoading(true);
    try {
      // Get all customer users
      const allUsers = await userService.getAllUsers();
      const customerUsers = allUsers.filter(user => user.role === 'customer');

      // Get order statistics for each customer
      const customersWithStats = await Promise.all(
        customerUsers.map(async (user) => {
          try {
            const userOrders = await orderService.getOrdersByUser(user.uid);
            const totalOrders = userOrders.length;
                         return {
               uid: user.uid,
               displayName: user.displayName || 'Unknown User',
               email: user.email,
               phoneNumber: user.phoneNumber,
               address: user.address,
               consumerNumber: user.consumerNumber,
               createdAt: user.createdAt || Date.now(),
               lastLoginAt: user.lastLoginAt,
               isActive: user.isActive !== false, // Default to true if not set
               totalOrders,
             };
          } catch (error) {
            console.error(`Error loading stats for user ${user.uid}:`, error);
                         return {
               uid: user.uid,
               displayName: user.displayName || 'Unknown User',
               email: user.email,
               phoneNumber: user.phoneNumber,
               address: user.address,
               consumerNumber: user.consumerNumber,
               createdAt: user.createdAt || Date.now(),
               lastLoginAt: user.lastLoginAt,
               isActive: user.isActive !== false,
               totalOrders: 0,
             };
          }
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast('error', 'Error', 'Failed to load customer data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerPress = (customer: CustomerUser) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    
    setCustomerToDelete(selectedCustomer);
    setDeleteCustomerModalVisible(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setIsDeleting(true);
      // Here you would implement the actual deletion logic
      // For now, we'll just remove from the local state
      setCustomers(prev => prev.filter(customer => customer.uid !== customerToDelete.uid));
      setSelectedCustomer(null);
      setModalVisible(false);
      showToast('success', 'Success', 'Customer deleted successfully.');
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast('error', 'Error', 'Failed to delete customer.');
    } finally {
      setIsDeleting(false);
      setDeleteCustomerModalVisible(false);
      setCustomerToDelete(null);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedCustomer) return;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast('error', 'Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Error', 'Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      await userService.updateUserPassword(selectedCustomer.uid, newPassword);
      showToast('success', 'Success', 'Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('error', 'Error', 'Failed to change password.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }

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
          <Text style={styles.headerTitle}>Customer Users</Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers by name, email, phone..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No customers found matching your search' : 'No customers found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Customers will appear here once they register'}
            </Text>
          </View>
        ) : (
          <View style={styles.customersList}>
            {filteredCustomers.map((customer) => (
              <View key={customer.uid} style={styles.customerCardContainer}>
                <TouchableOpacity
                  style={styles.customerCard}
                  onPress={() => handleCustomerPress(customer)}
                >
                  <View style={styles.customerHeader}>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{customer.displayName}</Text>
                      {customer.email && (
                        <Text style={styles.customerEmail}>{customer.email}</Text>
                      )}
                    </View>
                    {customer.phoneNumber && (
                      <Text style={styles.customerPhone}>{customer.phoneNumber}</Text>
                    )}
                  </View>
                  
                  <View style={styles.customerStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Orders</Text>
                      <Text style={styles.statValue}>{customer.totalOrders}</Text>
                    </View>
                    <View style={styles.statItemCenter}>
                      <Text style={styles.statLabel}>Joined</Text>
                      <Text style={styles.statValue}>{formatDate(customer.createdAt)}</Text>
                    </View>
                    <View style={styles.statItemRight}>
                      <View style={styles.actionPlaceholder} />
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionIconButton, styles.deleteButton]}
                    onPress={() => {
                      setCustomerToDelete(customer);
                      setDeleteCustomerModalVisible(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={18} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{selectedCustomer.displayName}</Text>
                  </View>
                  {selectedCustomer.email && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                    </View>
                  )}
                  {selectedCustomer.phoneNumber && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Phone Number</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.phoneNumber}</Text>
                    </View>
                  )}
                  {selectedCustomer.consumerNumber && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Consumer Number</Text>
                      <Text style={styles.detailValue}>{selectedCustomer.consumerNumber}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Account Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: selectedCustomer.isActive ? Colors.green + '20' : Colors.red + '20' }]}>
                      <Text style={[styles.statusText, { color: selectedCustomer.isActive ? Colors.green : Colors.red }]}>
                        {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Joined Date</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedCustomer.createdAt)}</Text>
                  </View>
                  {selectedCustomer.lastLoginAt && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Last Login</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedCustomer.lastLoginAt)}</Text>
                    </View>
                  )}
                </View>

                                 <View style={styles.detailSection}>
                   <Text style={styles.sectionTitle}>Order Statistics</Text>
                   <View style={styles.detailItem}>
                     <Text style={styles.detailLabel}>Total Orders</Text>
                     <Text style={styles.detailValue}>{selectedCustomer.totalOrders}</Text>
                   </View>
                 </View>

                {selectedCustomer.address && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <View style={styles.addressContainer}>
                      <MapPin size={16} color={Colors.textSecondary} style={styles.addressIcon} />
                      <Text style={styles.addressText}>{selectedCustomer.address}</Text>
                    </View>
                  </View>
                )}

                                 <View style={styles.detailSection}>
                   <Text style={styles.sectionTitle}>Change Password</Text>
                   <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>New Password</Text>
                     <TextInput
                       style={styles.input}
                       value={newPassword}
                       onChangeText={setNewPassword}
                       placeholder="Enter new password"
                       secureTextEntry
                     />
                   </View>
                   <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>Confirm Password</Text>
                     <TextInput
                       style={styles.input}
                       value={confirmPassword}
                       onChangeText={setConfirmPassword}
                       placeholder="Confirm new password"
                       secureTextEntry
                     />
                   </View>
                   <TouchableOpacity
                     style={[styles.actionButton, styles.passwordButton]}
                     onPress={handleChangePassword}
                   >
                     <Text style={styles.actionButtonText}>Change Password</Text>
                   </TouchableOpacity>
                 </View>


              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <DeleteCustomerBox
        visible={deleteCustomerModalVisible}
        onConfirm={confirmDeleteCustomer}
        onCancel={() => setDeleteCustomerModalVisible(false)}
        customerName={customerToDelete?.displayName}
        customerEmail={customerToDelete?.email}
      />

      {/* Toast */}
      <Toast
        visible={toastVisible}
        type={toastType}
        title={toastTitle}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
}

// DeleteCustomerBox Component
const DeleteCustomerBox: React.FC<{
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  customerName?: string;
  customerEmail?: string;
}> = ({ visible, onConfirm, onCancel, customerName, customerEmail }) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={deleteCustomerStyles.overlay}>
        <Animated.View
          style={[
            deleteCustomerStyles.container,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <View style={deleteCustomerStyles.iconContainer}>
            <User size={32} color={Colors.red} />
          </View>
          <Text style={deleteCustomerStyles.title}>
            Delete Customer
          </Text>
          <Text style={deleteCustomerStyles.message}>
            Are you sure you want to delete {customerName}? This action cannot be undone.
          </Text>
          
          {customerEmail && (
            <View style={deleteCustomerStyles.customerInfo}>
              <Text style={deleteCustomerStyles.customerEmail}>{customerEmail}</Text>
            </View>
          )}

          <View style={deleteCustomerStyles.buttonContainer}>
            <TouchableOpacity
              style={[deleteCustomerStyles.button, deleteCustomerStyles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={deleteCustomerStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[deleteCustomerStyles.button, deleteCustomerStyles.deleteButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <User size={16} color={Colors.white} />
              <Text style={deleteCustomerStyles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
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
  headerIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    marginLeft: 12,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  customersList: {
    gap: 16,
  },
  customerCardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    position: 'relative',
  },
  customerCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  actionIconButton: {
    backgroundColor: Colors.primaryLighter,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.redLighter,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
     customerPhone: {
     fontSize: 14,
     fontFamily: 'Inter_500Medium',
     color: Colors.primary,
     backgroundColor: Colors.primaryLighter,
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 12,
     alignSelf: 'flex-start',
   },
   customerEmail: {
     fontSize: 14,
     fontFamily: 'Inter_400Regular',
     color: Colors.textSecondary,
     marginTop: 2,
   },
   customerStats: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingTop: 12,
     borderTopWidth: 1,
     borderTopColor: Colors.border,
   },
   statsLeft: {
     flexDirection: 'row',
     gap: 24,
   },
   statItem: {
     alignItems: 'center',
     flex: 1,
   },
   statItemCenter: {
     alignItems: 'center',
     flex: 1,
   },
   statItemRight: {
     alignItems: 'center',
     flex: 1,
   },
   actionPlaceholder: {
     width: 40,
     height: 40,
   },
   statLabel: {
     fontSize: 12,
     fontFamily: 'Inter_400Regular',
     color: Colors.textSecondary,
     marginBottom: 4,
   },
   statValue: {
     fontSize: 14,
     fontFamily: 'Inter_600SemiBold',
     color: Colors.text,
   },
   statusBadge: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 6,
     alignSelf: 'flex-start',
   },
   statusText: {
     fontSize: 12,
     fontFamily: 'Inter_500Medium',
   },
  
  // Modal Styles
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
  modalContent: {
    padding: 20,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: 20,
    marginBottom: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

   passwordButton: {
     backgroundColor: Colors.yellow,
   },
   actionButtonText: {
     fontSize: 16,
     fontFamily: 'Inter_600SemiBold',
     color: Colors.white,
   },
   inputGroup: {
     marginBottom: 16,
   },
   inputLabel: {
     fontSize: 14,
     fontFamily: 'Inter_500Medium',
     color: Colors.text,
     marginBottom: 8,
   },
   input: {
     backgroundColor: Colors.background,
     borderRadius: 8,
     paddingHorizontal: 12,
     paddingVertical: 10,
     fontSize: 16,
     color: Colors.text,
     borderWidth: 1,
     borderColor: Colors.border,
   },
});

// DeleteCustomerBox Styles
const deleteCustomerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    zIndex: 9999,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    padding: 28,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 10000,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.redLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  customerInfo: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  customerEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: Colors.red,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
