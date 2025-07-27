import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { router } from 'expo-router';
import { ArrowLeft, Bell, ChevronRight, Edit, HelpCircle, Lock, LogOut, Mail, MapPin, Phone, Tag, Trash2, Truck, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// --- Mock Auth Hook ---
const useAuth = () => ({
  user: {
    name: 'Alpen Bhai',
    consumerNumber: 'HP123456789',
    mobile: '+91 98765 43210',
    email: 'alpen.bhai@example.com',
    address: '123, Main Street, Near Water Tank, Vadodara, Gujarat - 390001'
  },
  logout: () => console.log('Logged out'),
});

// --- Modal Content Components ---
const PersonalInfoContent = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [userInfo, setUserInfo] = useState(user);

    return (
        <View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                {isEditing ? <TextInput style={styles.input} value={userInfo.name} onChangeText={text => setUserInfo({...userInfo, name: text})} /> : <Text style={styles.infoValue}>{userInfo.name}</Text>}
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Consumer Number</Text>
                <Text style={styles.infoValue}>{userInfo.consumerNumber}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registered Mobile</Text>
                {isEditing ? <TextInput style={styles.input} value={userInfo.mobile} onChangeText={text => setUserInfo({...userInfo, mobile: text})} /> : <Text style={styles.infoValue}>{userInfo.mobile}</Text>}
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Address</Text>
                {isEditing ? <TextInput style={styles.input} value={userInfo.email} onChangeText={text => setUserInfo({...userInfo, email: text})} /> : <Text style={styles.infoValue}>{userInfo.email}</Text>}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
                <Text style={styles.editButtonText}>{isEditing ? 'Save Changes' : 'Edit Details'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const DeliveryAddressContent = ({ user }) => (
    <View>
        <View style={styles.addressCard}>
            <MapPin size={20} color={Colors.primary} />
            <Text style={styles.addressText}>{user.address}</Text>
            <View style={styles.addressActions}>
                <TouchableOpacity><Edit size={18} color={Colors.textSecondary} /></TouchableOpacity>
                <TouchableOpacity><Trash2 size={18} color={Colors.red} /></TouchableOpacity>
            </View>
        </View>
        <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
    </View>
);

const NotificationsContent = () => {
    const notifications = [
        { icon: Truck, title: 'Order on the way', message: 'Your order #ORD001 is out for delivery.', time: '10 mins ago', color: Colors.primary },
        { icon: Tag, title: 'Special Offer!', message: 'Get 15% off on your next booking with code SAVE15.', time: '1 hour ago', color: Colors.green },
        { icon: Bell, title: 'KYC Required', message: 'Please complete your KYC to continue enjoying our services.', time: '2 days ago', color: Colors.yellow },
    ];

    return (
        <View>
            {notifications.map((notif, index) => (
                <View key={index} style={styles.notificationItem}>
                    <View style={[styles.notificationIcon, {backgroundColor: `${notif.color}1A`}]}>
                        <notif.icon size={20} color={notif.color} />
                    </View>
                    <View style={styles.notificationTextContainer}>
                        <Text style={styles.notificationTitle}>{notif.title}</Text>
                        <Text style={styles.notificationMessage}>{notif.message}</Text>
                        <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const HelpSupportContent = () => (
    <View>
        <TouchableOpacity style={styles.helpRow}>
            <Phone size={20} color={Colors.primary} />
            <Text style={styles.helpText}>Call Customer Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpRow}>
            <Mail size={20} color={Colors.primary} />
            <Text style={styles.helpText}>Email Us</Text>
        </TouchableOpacity>
    </View>
);

const ChangePasswordContent = ({ onForgotPassword }) => (
    <View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>New Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Confirm New Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.forgotPasswordButton} onPress={onForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Update Password</Text>
        </TouchableOpacity>
    </View>
);

const ForgotPasswordContent = () => (
    <View>
        <Text style={styles.infoValue}>Enter your registered email or mobile number to receive a password reset link.</Text>
        <View style={[styles.infoRow, {marginTop: 20}]}>
            <Text style={styles.infoLabel}>Email / Mobile Number</Text>
            <TextInput style={styles.input} />
        </View>
        <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Send Reset Link</Text>
        </TouchableOpacity>
    </View>
);


export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');

  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  const openModal = (contentKey) => {
      setModalContent(contentKey);
      setModalVisible(true);
  }

  const menuItems = [
    { id: '1', title: 'Personal Information', icon: User, action: () => openModal('personal') },
    { id: '2', title: 'Delivery Address', icon: MapPin, action: () => openModal('address') },
    { id: '3', title: 'Change Password', icon: Lock, action: () => openModal('password') },
    { id: '4', title: 'Notifications', icon: Bell, action: () => openModal('notifications') },
    { id: '5', title: 'Help & Support', icon: HelpCircle, action: () => openModal('help') },
  ];

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }
  
  const renderModalContent = () => {
      switch(modalContent) {
          case 'personal': return <PersonalInfoContent user={user} />;
          case 'address': return <DeliveryAddressContent user={user} />;
          case 'notifications': return <NotificationsContent />;
          case 'help': return <HelpSupportContent />;
          case 'password': return <ChangePasswordContent onForgotPassword={() => setModalContent('forgotPassword')} />;
          case 'forgotPassword': return <ForgotPasswordContent />;
          default: return null;
      }
  }
  
  const getModalTitle = () => {
      if (modalContent === 'forgotPassword') return 'Forgot Password';
      const item = menuItems.find(item => item.action.toString().includes(modalContent));
      return item ? item.title : '';
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
          <Text style={styles.userDetails}>{user?.name}: {user?.consumerNumber}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statNumber}>2</Text>
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
            onPress={logout}
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
                <View style={styles.modalContent}>
                    {renderModalContent()}
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
  },
  modalContainer: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
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
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 16,
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
  helpText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  forgotPasswordButton: {
      alignSelf: 'flex-end',
      paddingVertical: 8,
  },
  forgotPasswordText: {
      color: Colors.primary,
      fontFamily: 'Inter_500Medium',
  },
});