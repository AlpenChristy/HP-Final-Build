import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Search, User, Phone, Mail, MapPin, Calendar, Eye, EyeOff, Edit, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { useAdminNavigation } from '../../core/auth/StableAdminLayout';
import { userService } from '../../core/services/userService';
import { orderService } from '../../core/services/orderService';

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

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

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
      Alert.alert('Error', 'Failed to load customer data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerPress = (customer: CustomerUser) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${selectedCustomer.displayName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              // Here you would implement the actual deletion logic
              // For now, we'll just remove from the local state
              setCustomers(prev => prev.filter(customer => customer.uid !== selectedCustomer.uid));
              setSelectedCustomer(null);
              setModalVisible(false);
              Alert.alert('Success', 'Customer deleted successfully.');
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!selectedCustomer) return;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      await userService.updateUserPassword(selectedCustomer.uid, newPassword);
      Alert.alert('Success', 'Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password.');
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
              <TouchableOpacity
                key={customer.uid}
                style={styles.customerCard}
                onPress={() => handleCustomerPress(customer)}
              >
                                 <View style={styles.customerHeader}>
                   <View style={styles.customerInfo}>
                     <Text style={styles.customerName}>{customer.displayName}</Text>
                   </View>
                   {customer.phoneNumber && (
                     <Text style={styles.customerPhone}>{customer.phoneNumber}</Text>
                   )}
                 </View>

                
              </TouchableOpacity>
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

                 <View style={styles.modalActions}>
                   <TouchableOpacity
                     style={[styles.actionButton, styles.deleteButton]}
                     onPress={handleDeleteCustomer}
                     disabled={isDeleting}
                   >
                     <Text style={styles.actionButtonText}>
                       {isDeleting ? 'Deleting...' : 'Delete Customer'}
                     </Text>
                   </TouchableOpacity>
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
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  customerInfo: {
    flex: 1,
  },
     customerName: {
     fontSize: 20,
     fontFamily: 'Inter_700Bold',
     color: Colors.text,
     marginBottom: 0,
   },
   customerPhone: {
     fontSize: 16,
     fontFamily: 'Inter_500Medium',
     color: Colors.primary,
     backgroundColor: Colors.primaryLighter,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 20,
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
     deleteButton: {
     backgroundColor: Colors.red,
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
