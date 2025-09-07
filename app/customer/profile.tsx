import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { router } from 'expo-router';
import { ArrowLeft, Bell, ChevronRight, Edit, Eye, EyeOff, HelpCircle, Lock, LogOut, Mail, MapPin, Phone, Tag, Trash2, Truck, User, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ForgotPasswordInfoBox from '../../components/ui/ForgotPasswordInfoBox';
import LogoutConfirmationBox from '../../components/ui/LogoutConfirmationBox';

import { useAuth } from '../../core/auth/AuthContext';
import { useAddress } from '../../core/context/AddressContext';
import { useConsumerNumber } from '../../core/context/ConsumerNumberContext';
import { customerAuthService } from '../../core/services/customerAuthService';
import { NotificationData, notificationService } from '../../core/services/notificationService';
import { orderService } from '../../core/services/orderService';
import { UserData, userService } from '../../core/services/userService';
import { createToastHelpers } from '../../core/utils/toastUtils';

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

// --- Modal Content Components ---
const PersonalInfoContent = ({ user, onSave, isSaving }: { user: any, onSave: (name: string, email: string, consumerNumber: string) => void, isSaving: boolean }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState<string>(user?.name || '');
    const [email, setEmail] = useState<string>(user?.email || '');
    const [consumerNumber, setConsumerNumber] = useState<string>(user?.consumerNumber || '');

    useEffect(() => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setConsumerNumber(user?.consumerNumber || '');
    }, [user]);

    const handlePress = () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }
        // Save
        onSave(name.trim(), email.trim(), consumerNumber.trim());
    };

    return (
        <View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        editable={!isSaving}
                    />
                ) : (
                    <Text style={styles.infoValue}>{user?.name}</Text>
                )}
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Consumer Number</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={consumerNumber}
                        onChangeText={setConsumerNumber}
                        placeholder="Enter your consumer number"
                        keyboardType="numeric"
                        maxLength={20}
                        editable={!isSaving}
                    />
                ) : (
                    <Text style={styles.infoValue}>{user?.consumerNumber || 'Not set'}</Text>
                )}
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registered Mobile</Text>
                <Text style={styles.infoValue}>{user?.mobile}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Address</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isSaving}
                    />
                ) : (
                    <Text style={styles.infoValue}>{user?.email}</Text>
                )}
            </View>
            <TouchableOpacity style={[styles.editButton, isSaving && { opacity: 0.7 }]} disabled={isSaving} onPress={handlePress}>
                <Text style={styles.editButtonText}>{isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Details'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const DeliveryAddressContent = ({ user, onUpdateAddress }: { user: any, onUpdateAddress: (address: string) => void }) => {
    const { address: sharedAddress, updateAddress } = useAddress();
    const toast = createToastHelpers();
    const [isEditing, setIsEditing] = useState(false);
    const [localAddress, setLocalAddress] = useState(sharedAddress || '');
    const [isSaving, setIsSaving] = useState(false);

    // Update local address state when shared address changes
    useEffect(() => {
        setLocalAddress(sharedAddress || '');
    }, [sharedAddress]);

    const handleSaveAddress = async () => {
        if (!localAddress.trim()) {
            toast.showError('Validation Error', 'Please enter a valid address.');
            return;
        }

        setIsSaving(true);
        try {
            // Update address using shared context (automatically syncs with checkout)
            await updateAddress(localAddress.trim());
            setIsEditing(false);
            toast.showAddressUpdatedSuccess();
        } catch (error) {
            console.error('Error saving address:', error);
            toast.showSaveError('address');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = () => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Update address using shared context (automatically syncs with checkout)
                            await updateAddress('');
                            setLocalAddress('');
                            toast.showAddressDeletedSuccess();
                        } catch (error) {
                            console.error('Error deleting address:', error);
                            toast.showDeleteError('address');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View>
            {sharedAddress ? (
                <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                        <MapPin size={20} color={Colors.primary} />
                        <Text style={styles.addressLabel}>Delivery Address</Text>
                    </View>
                    
                    {isEditing ? (
                        <View style={styles.addressEditContainer}>
                            <TextInput
                                style={styles.addressInput}
                                value={localAddress}
                                onChangeText={setLocalAddress}
                                placeholder="Enter your delivery address"
                                placeholderTextColor={Colors.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                autoFocus={true}
                            />
                            <View style={styles.addressInputActions}>
                                <TouchableOpacity 
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setLocalAddress(sharedAddress || '');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.saveButton, !localAddress.trim() && { opacity: 0.6 }]}
                                    onPress={handleSaveAddress}
                                    disabled={!localAddress.trim() || isSaving}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.addressText}>{sharedAddress}</Text>
                            <View style={styles.addressActions}>
                                <TouchableOpacity 
                                    style={styles.actionButton}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Edit size={16} color={Colors.primary} />
                                    <Text style={styles.actionButtonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.deleteButton]}
                                    onPress={handleDeleteAddress}
                                >
                                    <Trash2 size={16} color={Colors.red} />
                                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            ) : (
                <View style={styles.emptyAddressCard}>
                    <MapPin size={32} color={Colors.textSecondary} />
                    <Text style={styles.emptyAddressText}>No address added</Text>
                    <Text style={styles.emptyAddressSubtext}>Add your delivery address to receive orders</Text>
                    <TouchableOpacity 
                        style={styles.addAddressButton}
                        onPress={() => setIsEditing(true)}
                    >
                        <Text style={styles.addAddressButtonText}>Add Address</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {isEditing && !sharedAddress && (
                <View style={styles.addressInputContainer}>
                    <Text style={styles.inputLabel}>Add Delivery Address</Text>
                    <TextInput
                        style={styles.addressInput}
                        value={localAddress}
                        onChangeText={setLocalAddress}
                        placeholder="Enter your delivery address"
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        autoFocus={true}
                    />
                    <View style={styles.addressInputActions}>
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setIsEditing(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.saveButton, !localAddress.trim() && { opacity: 0.6 }]}
                            onPress={handleSaveAddress}
                            disabled={!localAddress.trim() || isSaving}
                        >
                            <Text style={styles.saveButtonText}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const NotificationsContent = ({ notifications, isLoading }: { notifications: NotificationData[], isLoading: boolean }) => {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'announcement': return Bell;
            case 'promo': return Tag;
            case 'order_update': return Truck;
            case 'system': return Bell;
            default: return Bell;
        }
    };

    const getNotificationColor = (priority: string) => {
        switch (priority) {
            case 'high': return Colors.red;
            case 'medium': return Colors.yellow;
            case 'low': return Colors.green;
            default: return Colors.primary;
        }
    };

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes} mins ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    if (notifications.length === 0) {
        return (
            <View style={styles.emptyNotificationsContainer}>
                <Bell size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                <Text style={styles.emptyNotificationsSubtext}>You'll see important updates here</Text>
            </View>
        );
    }

    return (
        <View>
            {notifications.map((notif) => {
                const IconComponent = getNotificationIcon(notif.type);
                const color = getNotificationColor(notif.priority);
                
                return (
                    <View key={notif.id} style={styles.notificationItem}>
                        <View style={[styles.notificationIcon, {backgroundColor: `${color}1A`}]}>
                            <IconComponent size={20} color={color} />
                        </View>
                        <View style={styles.notificationTextContainer}>
                            <Text style={styles.notificationTitle}>{notif.title}</Text>
                            <Text style={styles.notificationMessage}>{notif.message}</Text>
                            <Text style={styles.notificationTime}>{formatTime(notif.createdAt)}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const HelpSupportContent = () => (
    <View>
        <TouchableOpacity style={styles.helpRow}>
            <Phone size={20} color={Colors.primary} />
            <View style={styles.helpTextContainer}>
                <Text style={styles.helpText}>Office Line 1</Text>
                <Text style={styles.helpSubText}>02662-222724</Text>
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpRow}>
            <Phone size={20} color={Colors.primary} />
            <View style={styles.helpTextContainer}>
                <Text style={styles.helpText}>Office Line 2</Text>
                <Text style={styles.helpSubText}>02662-222788</Text>
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpRow}>
            <Mail size={20} color={Colors.primary} />
            <View style={styles.helpTextContainer}>
                <Text style={styles.helpText}>Email Us</Text>
                <Text style={styles.helpSubText}>viharelectrichp@gmail.com</Text>
            </View>
        </TouchableOpacity>
    </View>
);

const ChangePasswordContent = ({ onForgotPassword }: { onForgotPassword: () => void }) => {
    const { userSession } = useAuth();
    const toast = createToastHelpers();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword.trim()) {
            toast.showError('Validation Error', 'Please enter your current password.');
            return;
        }

        if (!newPassword.trim() || newPassword.length < 6) {
            toast.showError('Validation Error', 'New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.showError('Validation Error', 'New passwords do not match.');
            return;
        }

        if (currentPassword === newPassword) {
            toast.showError('Validation Error', 'New password must be different from current password.');
            return;
        }

        setIsLoading(true);
        try {
            // Get current user data from Firestore to verify current password
            if (!userSession?.uid) {
                throw new Error('User session not available');
            }

            const userData = await userService.getUserById(userSession.uid);
            if (!userData) {
                throw new Error('User data not found');
            }

            // Verify current password (same pattern as authentication)
            if (userData.password !== currentPassword) {
                toast.showError('Error', 'Current password is incorrect.');
                return;
            }

            // Update password in Firestore using customer auth service
            await customerAuthService.updateCustomerPassword(userSession.uid, newPassword);

            toast.showSuccess('Success', 'Password updated successfully!');
            
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.showError('Error', error.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        style={styles.passwordInput}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        secureTextEntry={!showCurrentPassword}
                        editable={!isLoading}
                    />
                    <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                        {showCurrentPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                    </TouchableOpacity>
                </View>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        style={styles.passwordInput}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        secureTextEntry={!showNewPassword}
                        editable={!isLoading}
                    />
                    <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                        {showNewPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                    </TouchableOpacity>
                </View>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        style={styles.passwordInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        secureTextEntry={!showConfirmPassword}
                        editable={!isLoading}
                    />
                    <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                    </TouchableOpacity>
                </View>
        </View>
        <TouchableOpacity style={styles.forgotPasswordButton} onPress={onForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.addButton, isLoading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={isLoading}
            >
                <Text style={styles.addButtonText}>
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                </Text>
        </TouchableOpacity>
    </View>
);
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userSession, logout, login } = useAuth();
  const { address, updateAddress, isLoading: addressLoading } = useAddress();
  const { consumerNumber, updateConsumerNumber, isLoading: consumerNumberLoading } = useConsumerNumber();
  const toast = createToastHelpers();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forgotInfoVisible, setForgotInfoVisible] = useState(false);

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    activeOrders: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // State for logout confirmation modal
  const [logoutConfirmationVisible, setLogoutConfirmationVisible] = useState(false);

  // Load user data and order statistics from database
  const loadUserDataAndStats = async (isRefresh = false) => {
    if (!userSession?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load user data
      const user = await userService.getUserById(userSession.uid);
      setUserData(user);

      // Load order statistics
      const userOrders = await orderService.getOrdersByUser(userSession.uid);
      
      const totalOrders = userOrders.length;
      const activeOrders = userOrders.filter(order => 
        order.orderStatus === 'pending' || 
        order.orderStatus === 'confirmed' || 
        order.orderStatus === 'out_for_delivery'
      ).length;

      setOrderStats({
        totalOrders,
        activeOrders
      });
    } catch (error) {
      console.error('Error loading user data and stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load notifications for customers
  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const customerNotifications = await notificationService.getActiveNotificationsForCustomers();
      setNotifications(customerNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadUserDataAndStats();
    loadNotifications();
  }, [userSession?.uid]);

  // Refresh data when component mounts to ensure latest data
  useEffect(() => {
    if (userSession?.uid) {
      refreshUserData();
    }
  }, []);

  const handleLogout = () => {
    setLogoutConfirmationVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.showGenericError('Failed to logout. Please try again.');
    } finally {
      setLogoutConfirmationVisible(false);
    }
  };

  // Handle address updates
  const handleUpdateAddress = (newAddress: string) => {
    // Address is automatically updated through the shared context
    // No need to manually update userData as it will be refreshed
  };

  // Refresh user data manually
  const refreshUserData = () => {
    if (userSession?.uid) {
      loadUserDataAndStats();
    }
  };

  // Create user object from session data and database data for compatibility
  const user = userSession ? {
    uid: userSession.uid,
    name: userData?.displayName || userSession.displayName || 'User',
    consumerNumber: consumerNumber, // Use context consumer number
    mobile: userData?.phoneNumber || '+91 98765 43210', // This should come from your user profile data
    email: userSession.email,
    address: address // This comes from shared context
  } : null;

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  const openModal = (contentKey: string) => {
      setModalContent(contentKey);
      setModalVisible(true);
  }

  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  const handleSavePersonalInfo = async (name: string, email: string, consumerNumber: string) => {
    if (!userSession?.uid) return;

    // Simple validations
    if (!name) {
      toast.showValidationError('name');
      return;
    }
    // Validate email ONLY if provided (allow phone-only users to skip email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      toast.showValidationError('email address');
      return;
    }

    setIsSavingPersonal(true);
    try {
      // 1) Update in Firestore
      const updatePayload: any = { displayName: name };
      if (email) {
        updatePayload.email = email;
      }
      await userService.updateUser(userSession.uid, updatePayload);

      // 2) Update consumer number using context (if changed)
      if (consumerNumber !== user?.consumerNumber) {
        await updateConsumerNumber(consumerNumber);
      }

      // 3) Refresh local session
      await login({ ...userSession, displayName: name, email: email || userSession.email });

      // 4) Update local screen state
      setUserData(prev => prev ? { ...prev, displayName: name, email: email || prev.email } : prev);

      // 5) Refresh user data to ensure consistency
      refreshUserData();

      setModalVisible(false);
      toast.showProfileUpdatedSuccess();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.showSaveError('profile');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const menuItems = [
    { id: '1', title: 'Personal Information', icon: User, action: () => openModal('personal') },
    { id: '2', title: 'Delivery Address', icon: MapPin, action: () => openModal('address') },
    { id: '3', title: 'Change Password', icon: Lock, action: () => openModal('password') },
    { id: '4', title: 'Notifications', icon: Bell, action: () => openModal('notifications') },
    { id: '5', title: 'Help & Support', icon: HelpCircle, action: () => openModal('help') },
  ];

  if (!fontsLoaded || consumerNumberLoading) {
    return <View style={styles.loadingContainer} />;
  }

  const renderModalContent = () => {
      switch(modalContent) {
          case 'personal': return <PersonalInfoContent user={user} onSave={handleSavePersonalInfo} isSaving={isSavingPersonal} />;
          case 'address': return <DeliveryAddressContent user={user} onUpdateAddress={handleUpdateAddress} />;
          case 'notifications': return <NotificationsContent notifications={notifications} isLoading={isLoadingNotifications} />;
          case 'help': return <HelpSupportContent />;
          case 'password': return <ChangePasswordContent onForgotPassword={() => setForgotInfoVisible(true)} />;
          default: return null;
      }
  }

  const getModalTitle = () => {
      switch(modalContent) {
          case 'personal': return 'Personal Information';
          case 'address': return 'Delivery Address';
          case 'password': return 'Change Password';
          case 'notifications': return 'Notifications';
          case 'help': return 'Help & Support';
          default: return '';
      }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={26} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.profileSection}>
          <Text style={styles.headerTitleText}>Profile</Text>
          <Text style={styles.userDetails}>
            {user?.name}
            {user?.consumerNumber && `: ${user.consumerNumber}`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {refreshing ? '...' : orderStats.totalOrders}
                </Text>
                <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {refreshing ? '...' : orderStats.activeOrders}
                </Text>
                <Text style={styles.statLabel}>Active Orders</Text>
            </View>
        </View>

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

        <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>HP Gas Service v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Generic Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {paddingBottom: insets.bottom + 10}]}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <X size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
              </View>
              <ScrollView 
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                  {renderModalContent()}
              </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationBox
        visible={logoutConfirmationVisible}
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmationVisible(false)}
        userName={user?.name}
      />
      {/* Forgot Password Info Box */}
      <ForgotPasswordInfoBox
        visible={forgotInfoVisible}
        onClose={() => setForgotInfoVisible(false)}
      />
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
    backgroundColor: Colors.primary,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },

  profileSection: {},
  headerTitleText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.white,
    opacity: 0.8,
  },
  content: {
    padding: 20,
    paddingTop: 20,
  },
  statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
  },
  statCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#959DA5',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
  },
  statNumber: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: Colors.primary,
      marginBottom: 4,
  },
  statLabel: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
      textAlign: 'center',
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
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  // --- Modal Styles ---
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
  },

  modalContainer: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      zIndex: 1001,
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
      flexGrow: 1,
  },
  infoRow: {
      marginBottom: 16,
  },
  infoLabel: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginBottom: 4,
  },
  infoValue: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  input: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      padding: 12,
  },
  editButton: {
      backgroundColor: Colors.primaryLighter,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
  },
  editButtonText: {
      color: Colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
  },
  addressCard: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
  },
  addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
  },
  addressLabel: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
  },
  addressText: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: Colors.text,
      lineHeight: 22,
  },
  addressActions: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: Colors.background,
  },
  actionButtonText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: Colors.primary,
  },
  deleteButton: {
      backgroundColor: Colors.redLighter,
  },
  deleteButtonText: {
      color: Colors.red,
  },
  addButton: {
      backgroundColor: Colors.primary,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
  },
  addButtonText: {
      color: Colors.white,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
  },
  notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: Colors.border,
  },
  notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  notificationTextContainer: {
      flex: 1,
  },
  notificationTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      marginBottom: 2,
  },
  notificationMessage: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      lineHeight: 20,
  },
  notificationTime: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginTop: 4,
  },
  helpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: Colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
  },
  helpTextContainer: {
      flex: 1,
  },
  helpText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  helpSubText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginTop: 2,
  },
  forgotPasswordButton: {
      alignSelf: 'flex-end',
      paddingVertical: 8,
  },
  forgotPasswordText: {
      color: Colors.primary,
      fontFamily: 'Inter_500Medium',
  },
  // New address styles
  addressInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: Colors.text,
      borderWidth: 1,
      borderColor: Colors.primary,
      borderRadius: 8,
      padding: 12,
      minHeight: 100,
      textAlignVertical: 'top',
      backgroundColor: Colors.white,
  },
  addressEditContainer: {
      flex: 1,
      marginRight: 8,
  },
  emptyAddressCard: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
  },
  emptyAddressText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
      marginTop: 12,
      marginBottom: 8,
  },
  emptyAddressSubtext: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
  },
  addAddressButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
  },
  addAddressButtonText: {
      color: Colors.white,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
  },
  addressInputContainer: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      marginTop: 8,
  },
  inputLabel: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      marginBottom: 12,
  },
  addressInputActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 16,
  },
  cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
  },
  cancelButtonText: {
      color: Colors.textSecondary,
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
  },
  saveButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
  },
  saveButtonText: {
      color: Colors.white,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
  },
  loadingText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
  },
  emptyNotificationsContainer: {
      padding: 40,
      alignItems: 'center',
  },
  emptyNotificationsText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
      marginTop: 16,
      marginBottom: 8,
  },
  emptyNotificationsSubtext: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      textAlign: 'center',
  },
  // Password reset styles
  resendButton: {
      alignSelf: 'center',
      paddingVertical: 12,
      marginTop: 16,
  },
  resendButtonText: {
      color: Colors.primary,
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
  },
  passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      backgroundColor: Colors.white,
  },
  passwordInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
      padding: 12,
  },
  eyeButton: {
      padding: 12,
  },

});