// Updated File: app/admin/_layout.tsx
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import { BarChart2, ClipboardList, Package, Truck, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { AdminProtectedRoute } from '../../core/auth/AdminProtectedRoute';
import { useAuth } from '../../core/auth/AuthContext';

export default function AdminTabLayout() {
  const colorScheme = useColorScheme();
  const { userSession, isLoading } = useAuth();
  
  // Don't render until we have a valid session
  if (isLoading || !userSession) {
    return null;
  }
  
  // Check if user is sub-admin and has specific permissions
  const isSubAdmin = userSession?.role === 'sub-admin';
  const hasPermission = (permission: string) => {
    if (!isSubAdmin) return true; // Full admin has all permissions
    if (!userSession?.permissions) return false;
    return userSession.permissions[permission as keyof typeof userSession.permissions] === true;
  };

  return (
    <AdminProtectedRoute>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null, // This hides the tab from the tab bar
          }}
        />
        <Tabs.Screen
          name="admindashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <BarChart2 size={24} color={focused ? color : color} fill="transparent" />
            ),
            href: userSession?.role === 'admin' ? '/admin/admindashboard' : null,
          }}
        />
        <Tabs.Screen
          name="adminordersmanagement"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, focused }) => (
              <ClipboardList size={24} color={focused ? color : color} fill="transparent" />
            ),
            href: hasPermission('orders') ? '/admin/adminordersmanagement' : null,
          }}
        />
        <Tabs.Screen
          name="adminproductmanagement"
          options={{
            title: 'Products',
            tabBarIcon: ({ color, focused }) => (
              <Package size={24} color={focused ? color : color} fill="transparent" />
            ),
            href: hasPermission('products') ? '/admin/adminproductmanagement' : null,
          }}
        />
        <Tabs.Screen
          name="admindeliverymanagement"
          options={{
            title: 'Delivery',
            tabBarIcon: ({ color, focused }) => (
              <Truck size={24} color={focused ? color : color} fill="transparent" />
            ),
            href: hasPermission('delivery') ? '/admin/admindeliverymanagement' : null,
          }}
        />
        <Tabs.Screen
          name="adminprofile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <User size={24} color={focused ? color : color} fill="transparent" />
            ),
          }}
        />
      </Tabs>
    </AdminProtectedRoute>
  );
}
