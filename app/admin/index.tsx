// File: app/admin/index.tsx
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../core/auth/AuthContext';

export default function AdminIndexScreen() {
  const { userSession, isLoading } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (isLoading || !userSession || hasNavigated) return;

    const navigate = () => {
      setHasNavigated(true);
      
      // Full admin goes to dashboard
      if (userSession.role === 'admin') {
        router.replace('/admin/admindashboard');
        return;
      }

      // Sub-admin goes to their first available screen
      if (userSession.role === 'sub-admin' && userSession.permissions) {
        if (userSession.permissions.orders) {
          router.replace('/admin/adminordersmanagement');
        } else if (userSession.permissions.products) {
          router.replace('/admin/adminproductmanagement');
        } else if (userSession.permissions.delivery) {
          router.replace('/admin/admindeliverymanagement');
        } else {
          // If no permissions, go to profile
          router.replace('/admin/adminprofile');
        }
        return;
      }

      // Fallback to dashboard
      router.replace('/admin/admindashboard');
    };

    // Add a small delay to ensure proper navigation
    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [userSession, isLoading, hasNavigated]);

  if (isLoading || !userSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  return <View style={{ flex: 1 }} />;
}
