import { Stack } from "expo-router";
import { AuthProvider } from '../core/auth/AuthContext';
import { CartProvider } from "../core/context/CartContext";
import { AddressProvider } from "../core/context/AddressContext";
import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CartProvider>
          <AddressProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/auth" />
              <Stack.Screen name="customer" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="delivery" options={{ headerShown: false }} />
            </Stack>
          </AddressProvider>
        </CartProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
