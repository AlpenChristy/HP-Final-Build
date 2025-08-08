// File: core/auth/AdminProtectedRoute.tsx
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from './AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, userSession } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !userSession) {
        // User is not authenticated, redirect to auth screen
        router.replace('/');
      } else if (userSession.role !== 'admin' && userSession.role !== 'sub-admin') {
        // User is authenticated but not an admin or sub-admin, redirect based on role
        if (userSession.role === 'delivery') {
          router.replace('/delivery/deliverydashboard');
        } else {
          router.replace('/customer/home');
        }
      }
    }
  }, [isAuthenticated, isLoading, userSession]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  // Don't render children if not authenticated or not admin/sub-admin
  if (!isAuthenticated || !userSession || (userSession.role !== 'admin' && userSession.role !== 'sub-admin')) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  // Render children if authenticated and admin or sub-admin
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
