import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../core/auth/AuthContext';
import { AddressProvider } from "../core/context/AddressContext";
import { CartProvider } from "../core/context/CartContext";
import { ConsumerNumberProvider } from "../core/context/ConsumerNumberContext";
import { ToastProvider } from "../core/context/ToastContext";
import '../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <CartProvider>
            <AddressProvider>
              <ConsumerNumberProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth/auth" />
                  <Stack.Screen name="customer" options={{ headerShown: false }} />
                  <Stack.Screen name="admin" options={{ headerShown: false }} />
                  <Stack.Screen name="delivery" options={{ headerShown: false }} />
                </Stack>
              </ConsumerNumberProvider>
            </AddressProvider>
          </CartProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
