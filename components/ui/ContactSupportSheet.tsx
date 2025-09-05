import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Phone as PhoneIcon, Mail as MailIcon, X as CloseIcon } from 'lucide-react-native';

const { height: screenHeight } = Dimensions.get('window');

export interface ContactItem {
  type: 'phone' | 'email';
  title: string; // e.g., 'Office Line 1'
  value: string; // e.g., '+91 2662-222788' or email
  subtitle?: string; // e.g., 'Vihar Electricals HP'
}

export interface ContactSupportSheetProps {
  visible: boolean;
  title?: string;
  items: ContactItem[];
  onClose: () => void;
}

const ContactSupportSheet: React.FC<ContactSupportSheetProps> = ({
  visible,
  title = 'Help & Support',
  items,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const handlePress = (item: ContactItem) => {
    if (item.type === 'phone') {
      const phone = item.value.replace(/\s|-/g, '');
      Linking.openURL(`tel:${phone}`);
    } else if (item.type === 'email') {
      Linking.openURL(`mailto:${item.value}`);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {items.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.card} activeOpacity={0.9} onPress={() => handlePress(item)}>
                <View style={styles.iconWrapper}>
                  {item.type === 'phone' ? (
                    <PhoneIcon size={20} color={Colors.primary} />
                  ) : (
                    <MailIcon size={20} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.texts}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardValue}>{item.value}</Text>
                  {item.subtitle ? <Text style={styles.cardSubtitle}>{item.subtitle}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 8 }} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  list: {
    gap: 12,
    marginTop: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 71, 161, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  texts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  cardValue: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default ContactSupportSheet;
