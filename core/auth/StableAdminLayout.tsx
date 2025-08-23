// File: core/auth/StableAdminLayout.tsx
import { router } from 'expo-router';
import { BarChart2, ClipboardList, Package, Truck, User } from 'lucide-react-native';
import React, { createContext, useContext, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { hasPermission } from './rbac';

// Import admin screens directly
import AdminDashboard from '../../app/admin/admindashboard';
import AdminDeliveryAgentScreen from '../../app/admin/admindeliverymanagement';
import AdminOrdersScreen from '../../app/admin/adminordersmanagement';
import AdminProductsScreen from '../../app/admin/adminproductmanagement';
import AdminProfileScreen from '../../app/admin/adminprofile';

// Navigation context for handling back actions
interface AdminNavigationContextType {
  goBack: () => void;
}

const AdminNavigationContext = createContext<AdminNavigationContextType>({
  goBack: () => router.replace('/'),
});

export const useAdminNavigation = () => useContext(AdminNavigationContext);

type AdminTab = 'dashboard' | 'orders' | 'products' | 'delivery' | 'profile';

const Colors = {
  primary: '#0D47A1',
  primaryLight: '#1E88E5',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D3557',
  textSecondary: '#6C757D',
  border: '#EAECEF',
  white: '#FFFFFF',
};

export const StableAdminLayout: React.FC = () => {
  const { userSession } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = userSession?.role === 'admin';

  // Determine available tabs based on permissions
  const availableTabs: { key: AdminTab; title: string; icon: any }[] = [];
  
  // Dashboard is available for both admin and sub-admin (as per RBAC)
  availableTabs.push({ key: 'dashboard', title: 'Dashboard', icon: BarChart2 });
  
  if (hasPermission(userSession, 'orders')) {
    availableTabs.push({ key: 'orders', title: 'Orders', icon: ClipboardList });
  }
  if (hasPermission(userSession, 'products')) {
    availableTabs.push({ key: 'products', title: 'Products', icon: Package });
  }
  if (hasPermission(userSession, 'delivery')) {
    availableTabs.push({ key: 'delivery', title: 'Delivery', icon: Truck });
  }
  availableTabs.push({ key: 'profile', title: 'Profile', icon: User });

  // Set initial tab to first available
  const [activeTab, setActiveTab] = useState<AdminTab>(availableTabs[0]?.key || 'profile');

  // Navigation handler for back actions
  const handleGoBack = () => {
    router.replace('/');
  };

  const navigationValue: AdminNavigationContextType = {
    goBack: handleGoBack,
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'orders':
        return <AdminOrdersScreen navigation={{}} />;
      case 'products':
        return <AdminProductsScreen navigation={{}} />;
      case 'delivery':
        return <AdminDeliveryAgentScreen navigation={{}} />;
      case 'profile':
      default:
        return <AdminProfileScreen navigation={{}} />;
    }
  };

  return (
    <AdminNavigationContext.Provider value={navigationValue}>
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.content}>
          {renderScreen()}
        </View>

        {/* Bottom Tab Bar */}
        <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
          {availableTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
              >
                <IconComponent 
                  size={24} 
                  color={isActive ? Colors.primary : Colors.textSecondary}
                  fill="transparent"
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isActive ? Colors.primary : Colors.textSecondary }
                ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </AdminNavigationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
