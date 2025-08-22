// File: core/auth/AdminRouter.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from './AuthContext';
import { firstAllowedAdminRoute, isRouteAllowed } from './rbac';
import AdminDashboard from '../../app/admin/admindashboard';
import AdminOrdersScreen from '../../app/admin/adminordersmanagement';
import AdminProductsScreen from '../../app/admin/adminproductmanagement';
import AdminDeliveryScreen from '../../app/admin/admindeliverymanagement';
import AdminProfileScreen from '../../app/admin/adminprofile';

interface Props {
  route: string; // e.g., 'admindashboard', 'adminordersmanagement'
}

export const AdminRouter: React.FC<Props> = ({ route }) => {
  const { userSession, isLoading } = useAuth();

  if (isLoading || !userSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  // If user doesn't have permission for this route, show the first allowed route
  const targetRoute = isRouteAllowed(userSession, route as any) ? route : firstAllowedAdminRoute(userSession);

  switch (targetRoute) {
    case 'admindashboard':
      return <AdminDashboard />;
    case 'adminordersmanagement':
      return <AdminOrdersScreen navigation={{}} />;
    case 'adminproductmanagement':
      return <AdminProductsScreen navigation={{}} />;
    case 'admindeliverymanagement':
      return <AdminDeliveryScreen navigation={{}} />;
    case 'adminprofile':
    default:
      return <AdminProfileScreen navigation={{}} />;
  }
};
