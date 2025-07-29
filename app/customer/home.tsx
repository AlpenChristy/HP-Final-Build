import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Import the hook to get safe area dimensions
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { ArrowRight, Flame, ShieldCheck, ShoppingCart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import LinearGradient for the gradient effect
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../core/auth/AuthContext';

// --- Color Palette (Matched with AuthScreen) ---
const Colors = {
  primary: '#0D47A1',
  primaryLight: '#1E88E5',
  primaryLighter: '#E3F2FD',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D3557',
  textSecondary: '#6C757D',
  border: '#E0E0E0',
  white: '#FFFFFF',
};

export default function CustomerHomeScreen() {
  const { userSession, isAuthenticated } = useAuth();
  // Get the safe area insets, specifically the top one for the status bar
  const insets = useSafeAreaInsets();



  // Create user object from session for compatibility
  const user = {
    name: userSession.displayName || 'User'
  };

  // Handler functions for button actions
  const handleOrderRefill = () => {
    Alert.alert('Order Refill', 'Redirecting to order placement...');
  };

  const handleTrackOrder = () => {
    // Navigate to the Orders tab
    router.push('/customer/delivery');
  };

  const handleOrderHistory = () => {
    // Navigate to the Orders tab
    router.push('/customer/delivery');
  };

  const handleClaimOffer = () => {
    Alert.alert('Weekly Offer', 'Congratulations! Your 10% discount has been applied to your account.');
  };

  const handleCartPress = () => {
    router.push('/customer/cart');
  };

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: Colors.primary }}>Loading...</Text>
      </View>
    );
  }

  return (
    // Use a regular View instead of SafeAreaView to control padding manually
    <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* --- Header (Style updated with dynamic top padding) --- */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View>
                <Text style={styles.greeting}>Hello, {user?.name || 'Customer'}!</Text>
                <Text style={styles.subGreeting}>Welcome Back to HP Gas Service</Text>
                </View>
                <TouchableOpacity style={styles.cartIconContainer} onPress={handleCartPress}>
                    <ShoppingCart size={26} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
                {/* --- Offer Banner with Gradient --- */}
                <LinearGradient
                    colors={[Colors.primaryLight, Colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.offerBanner}
                >
                    <Flame size={90} color={Colors.white} style={styles.offerBannerIcon} />
                    <View style={styles.offerTextContainer}>
                        <Text style={styles.offerTitle}>Weekly Wonder Deal</Text>
                        <Text style={styles.offerSubtitle}>Get 10% OFF on your next refill!</Text>
                    </View>
                    <TouchableOpacity style={styles.offerButton} onPress={handleClaimOffer}>
                        <Text style={styles.offerButtonText}>Claim Now</Text>
                        <ArrowRight size={16} color={Colors.white} />
                    </TouchableOpacity>
                </LinearGradient>

                {/* --- Main Action Grid --- */}
                <View style={styles.gridContainer}>
                <TouchableOpacity style={[styles.card, styles.cardLarge]} onPress={handleOrderRefill}>
                    <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Order a Refill</Text>
                    <Text style={styles.cardSubtitle}>Schedule a new cylinder delivery.</Text>
                    <TouchableOpacity style={styles.cardButton} onPress={handleOrderRefill}>
                        <Text style={styles.cardButtonText}>Order Now</Text>
                    </TouchableOpacity>
                    </View>
                    <Image 
                        source={require('../../assets/images/bottlewithcart.png')} 
                        style={styles.bottleImage}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <View style={styles.gridRow}>
                    <TouchableOpacity style={styles.card} onPress={handleTrackOrder}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Track Order</Text>
                        <Text style={styles.cardSubtitle}>See order status</Text>
                    </View>
                    <Image 
                        source={require('../../assets/images/trackorder.png')} 
                        style={styles.trackOrderImage}
                        resizeMode="contain"
                    />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.card} onPress={handleOrderHistory}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Order History</Text>
                        <Text style={styles.cardSubtitle}>View past orders</Text>
                    </View>
                    <Image 
                        source={require('../../assets/images/order.png')} 
                        style={styles.orderImage}
                        resizeMode="contain"
                    />
                    </TouchableOpacity>
                </View>
                </View>

                {/* --- Safety Tip --- */}
                <View style={styles.safetyCard}>
                <View style={styles.safetyIcon}>
                    <ShieldCheck size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.safetyTitle}>Safety Tip</Text>
                    <Text style={styles.safetyText}>Always store your gas cylinder in a well-ventilated area.</Text>
                </View>
                </View>
           
            </View>
        </ScrollView>
    </View>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.white, marginTop:6 },
  subGreeting: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.white, opacity: 0.9, marginTop: 4 },
  cartIconContainer: { 
    marginLeft: 16, 
    marginTop: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  mainContent: {
    padding: 20,
  },
  offerBanner: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  offerBannerIcon: {
    opacity: 0.1, position: 'absolute', right: -10, top: -20, transform: [{ rotate: '15deg' }]
  },
  offerTextContainer: {
    position: 'relative',
    zIndex: 1,
  },
  offerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    color: Colors.white,
  },
  offerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    opacity: 0.9,
    color: Colors.white,
    marginTop: 4,
    maxWidth: '80%',
  },
  offerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerButtonText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginRight: 8,
  },
  gridContainer: {
    marginBottom: 24,
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 15,
    elevation: 5,
    flex: 1,
  },
  cardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
    alignSelf: 'flex-start',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardButtonText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  cardIcon: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryLighter,
    padding: 12,
    borderRadius: 99,
    marginTop: 12,
  },
  cardIconLarge: {
    backgroundColor: Colors.primaryLighter,
    padding: 20,
    borderRadius: 20,
    marginLeft: 16,
  },
  bottleImage: {
    width: 126,
    height: 126,
  },
  trackOrderImage: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 0,
  },
  orderImage: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginBottom: 0,
  },
  safetyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,

},

  safetyIcon: {
    backgroundColor: Colors.primaryLighter,
    padding: 12,
    borderRadius: 99,
  },
  safetyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  safetyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});