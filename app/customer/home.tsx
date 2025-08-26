import { useEffect, useState } from 'react';
import {
    Dimensions,
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
import { ArrowRight, Flame, ShoppingCart, Tag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import LinearGradient for the gradient effect
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PromocodeDetailBox from '../../components/ui/PromocodeDetailBox';
import { useAuth } from '../../core/auth/AuthContext';
import { useCart } from '../../core/context/CartContext';
import { PromocodeData, promocodeService } from '../../core/services/promocodeService';

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
    name: userSession?.displayName || 'User'
  };

  // Get cart items for badge count
  const { cartItems } = useCart();

  // State for featured promocodes
  const [featuredPromocodes, setFeaturedPromocodes] = useState<PromocodeData[]>([]);
  const [isLoadingPromocodes, setIsLoadingPromocodes] = useState(true);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  
  // State for promocode detail modal
  const [promocodeDetailVisible, setPromocodeDetailVisible] = useState(false);
  const [selectedPromocode, setSelectedPromocode] = useState<PromocodeData | undefined>(undefined);

  // Load featured promocodes on component mount
  useEffect(() => {
    loadFeaturedPromocodes();
  }, []);

  const loadFeaturedPromocodes = async () => {
    try {
      setIsLoadingPromocodes(true);
      const promocodes = await promocodeService.getFeaturedPromocodes(3);
      setFeaturedPromocodes(promocodes);
    } catch (error) {
      console.error('Error loading featured promocodes:', error);
    } finally {
      setIsLoadingPromocodes(false);
    }
  };

  // Calculate total items in cart
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Format discount text for display
  const getDiscountText = (promocode: PromocodeData) => {
    if (promocode.discountType === 'percentage') {
      return `${promocode.discountValue}% OFF`;
    } else {
      return `₹${promocode.discountValue} OFF`;
    }
  };

  // Get offer title based on promocode
  const getOfferTitle = (promocode: PromocodeData) => {
    if (promocode.description) {
      return promocode.description;
    }
    return `Use Code: ${promocode.code}`;
  };

  // Handler functions for button actions
  const handleOrderRefill = () => {
    // Navigate to the Products tab
    router.push('/customer/products');
  };

  const handleTrackOrder = () => {
    // Navigate to the Orders tab with current tab active
    router.push('/customer/orders');
  };

  const handleOrderHistory = () => {
    // Navigate to the Orders tab with history tab active
    router.push('/customer/orders?tab=history');
  };

  const handleClaimOffer = (promocode?: PromocodeData) => {
    setSelectedPromocode(promocode);
    setPromocodeDetailVisible(true);
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
                    {getCartItemCount() > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
                {/* --- Dynamic Offer Banner with Promocodes --- */}
                {!isLoadingPromocodes && featuredPromocodes.length > 0 ? (
                  featuredPromocodes.length > 1 ? (
                    <View>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                          const { contentOffset, layoutMeasurement } = e.nativeEvent;
                          const index = Math.round(contentOffset.x / layoutMeasurement.width);
                          setActivePromoIndex(index);
                        }}
                      >
                        {featuredPromocodes.map((promocode) => (
                          <View key={promocode.id} style={{ width: Dimensions.get('window').width - 40 }}>
                            <View style={styles.carouselItemWrapper}>
                              <LinearGradient
                                colors={[Colors.primaryLight, Colors.primary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.offerBanner}
                              >
                                <Tag size={90} color={Colors.white} style={styles.offerBannerIcon} />
                                <View style={styles.offerTextContainer}>
                                  <Text style={styles.offerTitle}>{getOfferTitle(promocode)}</Text>
                                  <Text style={styles.offerSubtitle}>{getDiscountText(promocode)}</Text>
                                  {promocode.minOrderAmount && (
                                    <Text style={styles.offerMinAmount}>Min. Order: ₹{promocode.minOrderAmount}</Text>
                                  )}
                                </View>
                                <TouchableOpacity 
                                  style={styles.offerButton} 
                                  onPress={() => handleClaimOffer(promocode)}
                                >
                                  <Text style={styles.offerButtonText}>Use Code</Text>
                                  <ArrowRight size={16} color={Colors.white} />
                                </TouchableOpacity>
                              </LinearGradient>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                      {/* Dots */}
                      <View style={styles.dotsContainer}>
                        {featuredPromocodes.map((_, i) => (
                          <View key={i} style={[styles.dot, i === activePromoIndex && styles.dotActive]} />
                        ))}
                      </View>
                    </View>
                  ) : (
                    // Single banner
                    <LinearGradient
                      colors={[Colors.primaryLight, Colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.offerBanner}
                    >
                      <Tag size={90} color={Colors.white} style={styles.offerBannerIcon} />
                      <View style={styles.offerTextContainer}>
                        <Text style={styles.offerTitle}>{getOfferTitle(featuredPromocodes[0])}</Text>
                        <Text style={styles.offerSubtitle}>{getDiscountText(featuredPromocodes[0])}</Text>
                        {featuredPromocodes[0].minOrderAmount && (
                          <Text style={styles.offerMinAmount}>Min. Order: ₹{featuredPromocodes[0].minOrderAmount}</Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.offerButton} 
                        onPress={() => handleClaimOffer(featuredPromocodes[0])}
                      >
                        <Text style={styles.offerButtonText}>Use Code</Text>
                        <ArrowRight size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </LinearGradient>
                  )
                ) : (
                  // Fallback to default offer banner
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
                    <TouchableOpacity style={styles.offerButton} onPress={() => handleClaimOffer()}>
                      <Text style={styles.offerButtonText}>Claim Now</Text>
                      <ArrowRight size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </LinearGradient>
                )
              }

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
           
            </View>
        </ScrollView>
        
        {/* Promocode Detail Modal */}
        <PromocodeDetailBox
          visible={promocodeDetailVisible}
          promocode={selectedPromocode}
          onClose={() => {
            setPromocodeDetailVisible(false);
            setSelectedPromocode(undefined);
          }}
        />
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
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
  carouselItemWrapper: {
    paddingHorizontal: 0,
  },
  offerBannerMargin: {
    marginTop: 16,
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
  offerMinAmount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
    color: Colors.white,
    marginTop: 2,
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
  dotsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginTop: -12,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(13, 71, 161, 0.3)',
  },
  dotActive: {
    backgroundColor: Colors.primary,
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

});