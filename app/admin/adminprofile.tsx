import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Edit, Lock, LogOut, Trash2, User, Users, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { subAdminService, SubAdminData, SubAdminPermissions } from '../../core/services/subAdminService';

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
};



// --- Modal Content Components ---
const EditProfileContent = ({ user }: { user: any }) => {
    const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' });
    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput style={styles.input} value={formData.name} onChangeText={text => setFormData({...formData, name: text})} />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} value={formData.email} onChangeText={text => setFormData({...formData, email: text})} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
        </View>
    );
};

const ChangePasswordContent = () => (
    <View>
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Update Password</Text>
        </TouchableOpacity>
    </View>
);

const SubAdminContent = ({ setModalView, setEditingAdmin, subAdmins, onDeleteSubAdmin }: { 
    setModalView: any, 
    setEditingAdmin: any,
    subAdmins: SubAdminData[],
    onDeleteSubAdmin: (uid: string) => void
}) => {
    const handleEdit = (admin: SubAdminData) => {
        setEditingAdmin(admin);
        setModalView('addOrEdit');
    }

    const handleDelete = (admin: SubAdminData) => {
        Alert.alert(
            'Delete Sub-Admin',
            `Are you sure you want to delete ${admin.displayName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDeleteSubAdmin(admin.uid),
                },
            ]
        );
    };

    return (
        <View>
            {subAdmins.map(admin => (
                <View key={admin.uid} style={styles.subAdminCard}>
                    <View style={{flex: 1}}>
                        <Text style={styles.subAdminName}>{admin.displayName}</Text>
                        <Text style={styles.subAdminEmail}>{admin.email}</Text>
                        <View style={styles.permissionTags}>
                            {admin.permissions.dashboard && <Text style={styles.permissionTag}>Dashboard</Text>}
                            {admin.permissions.orders && <Text style={styles.permissionTag}>Orders</Text>}
                            {admin.permissions.delivery && <Text style={styles.permissionTag}>Delivery</Text>}
                            {admin.permissions.products && <Text style={styles.permissionTag}>Products</Text>}
                        </View>
                    </View>
                    <View style={styles.subAdminActions}>
                        <TouchableOpacity onPress={() => handleEdit(admin)}>
                            <Edit size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(admin)}>
                            <Trash2 size={18} color={Colors.red} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            {subAdmins.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No sub-admins created yet</Text>
                </View>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={() => { setEditingAdmin(null); setModalView('addOrEdit'); }}>
                <Text style={styles.saveButtonText}>Add New Sub-admin</Text>
            </TouchableOpacity>
        </View>
    );
}

const AddSubAdminContent = ({ editingAdmin, onSave }: { editingAdmin: SubAdminData | null, onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        name: editingAdmin?.displayName || '',
        phone: editingAdmin?.phoneNumber || '',
        email: editingAdmin?.email || '',
        password: '',
    });
    const [permissions, setPermissions] = useState<SubAdminPermissions>({
        orders: editingAdmin?.permissions?.orders || false,
        delivery: editingAdmin?.permissions?.delivery || false,
        products: editingAdmin?.permissions?.products || false,
    });
    const [isLoading, setIsLoading] = useState(false);

    const togglePermission = (key: keyof SubAdminPermissions) => {
        setPermissions(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (!editingAdmin && !formData.password.trim()) {
            Alert.alert('Error', 'Password is required for new sub-admin.');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                displayName: formData.name.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phone.trim(),
                password: formData.password,
                permissions,
                isEdit: !!editingAdmin,
                uid: editingAdmin?.uid,
            });
        } catch (error) {
            console.error('Error saving sub-admin:', error);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.name} 
                    onChangeText={text => setFormData({...formData, name: text})} 
                    placeholder="Enter sub-admin name" 
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.phone} 
                    onChangeText={text => setFormData({...formData, phone: text})} 
                    placeholder="Enter phone number" 
                    keyboardType="phone-pad" 
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.email} 
                    onChangeText={text => setFormData({...formData, email: text})} 
                    placeholder="Enter email address" 
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    editable={!editingAdmin} // Don't allow email editing for existing users
                />
            </View>
            {!editingAdmin && (
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.password} 
                        onChangeText={text => setFormData({...formData, password: text})} 
                        placeholder="Create a password" 
                        secureTextEntry 
                    />
                </View>
            )}
            
            <Text style={styles.modalSectionTitle}>Module Access</Text>
            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Orders Management</Text>
                <Switch 
                    value={permissions.orders} 
                    onValueChange={() => togglePermission('orders')} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>
            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Delivery Agent Management</Text>
                <Switch 
                    value={permissions.delivery} 
                    onValueChange={() => togglePermission('delivery')} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>
            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Product Management</Text>
                <Switch 
                    value={permissions.products} 
                    onValueChange={() => togglePermission('products')} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isLoading}
            >
                <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : (editingAdmin ? 'Update Sub-admin' : 'Create Sub-admin')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default function AdminProfileScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { userSession, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalView, setModalView] = useState('list');
  const [editingAdmin, setEditingAdmin] = useState<SubAdminData | null>(null);
  const [subAdmins, setSubAdmins] = useState<SubAdminData[]>([]);
  const [isLoadingSubAdmins, setIsLoadingSubAdmins] = useState(false);


  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load sub-admins when component mounts
  useEffect(() => {
    loadSubAdmins();
  }, [userSession]);

  const loadSubAdmins = async () => {
    if (!userSession?.uid) return;
    
    setIsLoadingSubAdmins(true);
    try {
      const adminSubAdmins = await subAdminService.getSubAdminsByAdmin(userSession.uid);
      setSubAdmins(adminSubAdmins);
    } catch (error) {
      console.error('Error loading sub-admins:', error);
      Alert.alert('Error', 'Failed to load sub-admins.');
    } finally {
      setIsLoadingSubAdmins(false);
    }
  };

  const handleSaveSubAdmin = async (data: any) => {
    if (!userSession?.uid || !userSession?.email) {
      return;
    }

    try {
      if (data.isEdit) {
        // Update existing sub-admin
        await subAdminService.updateSubAdminPermissions(data.uid, data.permissions);
        if (data.displayName !== editingAdmin?.displayName || data.phoneNumber !== editingAdmin?.phoneNumber) {
          await subAdminService.updateSubAdminProfile(data.uid, {
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
          });
        }
        Alert.alert('Success', 'Sub-admin updated successfully!');
      } else {
        // Create new sub-admin
        await subAdminService.createSubAdmin(
          userSession.uid,
          {
            email: data.email,
            password: data.password,
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
            permissions: data.permissions,
          }
        );
        Alert.alert('Success', 'Sub-admin created successfully!');
      }
      
      // Reload sub-admins and close modal (for edit case)
      await loadSubAdmins();
      setModalVisible(false);
      setModalView('list');
      setEditingAdmin(null);
    } catch (error) {
      console.error('Error saving sub-admin:', error);
      Alert.alert('Error', 'Failed to save sub-admin. Please try again.');
    }
  };

  const handleDeleteSubAdmin = async (uid: string) => {
    try {
      await subAdminService.deactivateSubAdmin(uid);
      Alert.alert('Success', 'Sub-admin deleted successfully!');
      await loadSubAdmins();
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      Alert.alert('Error', 'Failed to delete sub-admin. Please try again.');
    }
  };



  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openModal = (contentKey: string) => {
      setModalContent(contentKey);
      setModalView('list');
      setEditingAdmin(null);
      setModalVisible(true);
  }

  const menuItems = [
    { id: '1', title: 'Edit Profile', icon: User, action: () => openModal('editProfile') },
    { id: '2', title: 'Change Password', icon: Lock, action: () => openModal('changePassword') },
    // Only show sub-admin management for full admins, not sub-admins
    ...(userSession?.role === 'admin' ? [
      { id: '3', title: 'Sub-admin Management', icon: Users, action: () => openModal('subAdmin') }
    ] : []),
  ];

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }
  
  const renderModalContent = () => {
      switch(modalContent) {
          case 'editProfile': return <EditProfileContent user={userSession} />;
          case 'changePassword': return <ChangePasswordContent />;
          case 'subAdmin': 
            return modalView === 'list' ? 
              <SubAdminContent 
                setModalView={setModalView} 
                setEditingAdmin={setEditingAdmin} 
                subAdmins={subAdmins}
                onDeleteSubAdmin={handleDeleteSubAdmin}
              /> : 
              <AddSubAdminContent 
                editingAdmin={editingAdmin} 
                onSave={handleSaveSubAdmin}
              />;
          default: return null;
      }
  }
  
  const getModalTitle = () => {
      if (modalContent === 'subAdmin') {
          if (modalView === 'list') return 'Sub-admin Management';
          return editingAdmin ? 'Edit Sub-admin' : 'Add New Sub-admin';
      }
      const item = menuItems.find(item => item.action.toString().includes(modalContent));
      return item ? item.title : '';
  }

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
            <Text style={styles.headerTitle}>My Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.action}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <item.icon size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuText}>
                    {item.title}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
        </View>

        <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, styles.logoutIcon]}>
                <LogOut size={20} color={Colors.red} />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>
                Logout
              </Text>
            </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Generic Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, {paddingBottom: insets.bottom}]}>
                <View style={styles.modalHeader}>
                    {modalView !== 'list' && modalContent === 'subAdmin' && (
                        <TouchableOpacity onPress={() => setModalView('list')} style={styles.modalBack}>
                            <ArrowLeft size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    <View style={styles.modalForm}>
                        {renderModalContent()}
                    </View>
                </ScrollView>
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
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  logoutItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderBottomWidth: 0,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIcon: {
    backgroundColor: Colors.redLighter,
  },
  logoutText: {
    color: Colors.red,
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
  modalBack: {
      position: 'absolute',
      left: 20,
      padding: 4,
  },
  modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      textAlign: 'center',
      flex: 1,
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
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  subAdminCard: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  subAdminName: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
  },
  subAdminEmail: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
  },
  subAdminActions: {
      flexDirection: 'row',
      gap: 16,
  },
  permissionTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
  },
  permissionTag: {
      backgroundColor: Colors.primaryLighter,
      color: Colors.primary,
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  modalSectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      marginBottom: 8,
  },
  permissionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  permissionLabel: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

