// File: core/auth/RequirePermission.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from './AuthContext';
import { AdminPermissionKey, isRouteAllowed, hasPermission } from './rbac';
import { router } from 'expo-router';

interface Props {
  permission?: AdminPermissionKey; // If omitted, just checks admin/sub-admin role
  fallbackRoute?: string; // e.g., '/admin/adminprofile'
  children: React.ReactNode;
}

export const RequirePermission: React.FC<Props> = ({ permission, fallbackRoute = '/admin/adminprofile', children }) => {
  const { isLoading, userSession } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  const allowed = permission ? hasPermission(userSession, permission) : !!userSession && (userSession.role === 'admin' || userSession.role === 'sub-admin');

  if (!allowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>You do not have permission to access this section.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace(fallbackRoute as any)}>
          <Text style={styles.btnText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 16 },
  msg: { color: '#1D3557', fontSize: 16, textAlign: 'center', marginBottom: 12 },
  btn: { backgroundColor: '#0D47A1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
