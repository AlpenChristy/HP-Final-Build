import { Stack } from "expo-router";
import { AuthProvider } from '../core/auth/AuthContext';
import { CartProvider } from "../core/context/CartContext";
import { AddressProvider } from "../core/context/AddressContext";
import '../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
