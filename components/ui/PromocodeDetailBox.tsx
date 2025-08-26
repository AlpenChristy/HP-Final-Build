import { X as CloseIcon, TicketPercent } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Import Colors from the constants
import { Colors } from '../../constants/Colors';

// Define PromocodeData interface locally to avoid circular dependencies
export interface PromocodeData {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description?: string;
  minOrderAmount?: number;
  isActive?: boolean;
  createdAt?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export interface PromocodeDetailBoxProps {
  visible: boolean;
  promocode?: PromocodeData;
  onClose: () => void;
}

const PromocodeDetailBox: React.FC<PromocodeDetailBoxProps> = ({
  visible,
  promocode,
  onClose,
}) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Animation logic for showing and hiding the modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  // Helper to format the discount text
  const getDiscountText = (promo: PromocodeData) => {
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}% OFF`;
    }
    return `₹${promo.discountValue} OFF`;
  };

  // Main render function
  if (!promocode && !visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          {/* Main content of the offer card */}
          <View style={styles.contentWrapper}>
            {promocode ? (
              <>
                {/* Top Section: The main offer details */}
                <View style={styles.offerBody}>
                  <View style={styles.iconContainer}>
                    <TicketPercent size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.discountValueText}>
                    {getDiscountText(promocode)}
                  </Text>
                  <Text style={styles.descriptionText}>
                    {promocode.description || 'Enjoy a special discount on your next order.'}
                  </Text>
                  {promocode.minOrderAmount && (
                    <View style={styles.minOrderContainer}>
                      <Text style={styles.minOrderText}>
                        On orders above ₹{promocode.minOrderAmount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Separator: Creates the ticket/coupon effect */}
                <View style={styles.separatorContainer}>
                  <View style={styles.cutout} />
                  <View style={styles.dashedLine} />
                  <View style={styles.cutout} />
                </View>

                {/* Bottom Section: The promocode */}
                <View style={styles.offerCodeSection}>
                  <Text style={styles.codeInstructionText}>
                    Use code at checkout
                  </Text>
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeText}>{promocode.code}</Text>
                  </View>
                </View>
              </>
            ) : (
              // Fallback view if no promocode is provided
              <View style={styles.defaultOfferContainer}>
                 <View style={styles.iconContainer}>
                    <TicketPercent size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.defaultOfferTitle}>Weekly Wonder Deal</Text>
                  <Text style={styles.defaultOfferText}>
                    Congratulations! Your 10% discount has been automatically applied to your account.
                  </Text>
              </View>
            )}
          </View>
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: screenWidth - 100, // Made narrower
    maxWidth: 290, // Reduced max width
    borderRadius: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  contentWrapper: {
    borderRadius: 16,
    overflow: 'hidden', // Ensures children conform to border radius
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 22, // Make sure it's above the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Styles for the top part of the card
  offerBody: {
    backgroundColor: Colors.background,
    padding: 20, // Reduced padding
    alignItems: 'center',
  },
  iconContainer: {
    width: 56, // Made smaller
    height: 56, // Made smaller
    borderRadius: 28, // Adjusted for new size
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discountValueText: {
    fontSize: 34, // Reduced font size
    // Replace with your bold font if available
    fontWeight: '800',
    color: Colors.primary,
  },
  descriptionText: {
    fontSize: 13, // Reduced font size
    // Replace with your medium font
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18, // Adjusted line height
  },
  minOrderContainer: {
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(13, 71, 161, 0.1)',
    borderRadius: 12,
  },
  minOrderText: {
    fontSize: 12,
    // Replace with your medium font
    fontWeight: '500',
    color: Colors.primary,
  },
  // Styles for the separator
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  cutout: {
    width: 20, // Made smaller
    height: 20, // Made smaller
    borderRadius: 10, // Adjusted for new size
    backgroundColor: Colors.white,
  },
  dashedLine: {
    height: 1,
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  // Styles for the bottom part of the card
  offerCodeSection: {
    backgroundColor: Colors.white,
    padding: 16, // Reduced padding
    alignItems: 'center',
  },
  codeInstructionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    // Replace with your regular font
    fontWeight: '400',
  },
  codeContainer: {
    paddingVertical: 10, // Reduced padding
    paddingHorizontal: 20, // Reduced padding
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(13, 71, 161, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(13, 71, 161, 0.05)',
  },
  codeText: {
    fontSize: 18, // Reduced font size
    color: Colors.primary,
    // Replace with your bold font
    fontWeight: '700',
    letterSpacing: 2,
  },
  // Styles for the default/fallback view
  defaultOfferContainer: {
    alignItems: 'center',
    padding: 24,
  },
  defaultOfferTitle: {
    fontSize: 18, // Reduced font size
    // Replace with your bold font
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  defaultOfferText: {
    fontSize: 13, // Reduced font size
    // Replace with your regular font
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PromocodeDetailBox;
