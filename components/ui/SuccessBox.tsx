import { CheckCircle, X as CloseIcon, XCircle } from 'lucide-react-native';
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

// Assuming Colors are defined elsewhere in your project
// For demonstration, I'll create a mock object.
const Colors = {
  surface: '#FFFFFF',
  text: '#1D3557',
  textSecondary: '#6C757D',
  border: '#F1F5F9',
  white: '#FFFFFF',
  green: '#16A34A',
  greenLighter: '#F0FDF4',
  yellow: '#F59E0B',
  yellowLighter: '#FEF3C7',
  red: '#DC2626',
  redLighter: '#FFEBEE',
};

const { width: screenWidth } = Dimensions.get('window');

export interface StatusBoxProps {
  visible: boolean;
  type?: 'success' | 'warning' | 'error';
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  showCancel?: boolean;
}

const SuccessBox: React.FC<StatusBoxProps> = ({
  visible,
  type = 'success',
  onConfirm,
  onCancel,
  title = 'Success',
  message = 'Operation completed successfully!',
  confirmText = 'Continue',
  showCancel = false,
}) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Animation logic for showing and hiding the modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getThemeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          Icon: CheckCircle, // Changed to CheckCircle icon for yellow theme
          color: Colors.yellow,
          lighterColor: Colors.yellowLighter,
        };
      case 'error':
        return {
          Icon: XCircle,
          color: Colors.red,
          lighterColor: Colors.redLighter,
        };
      case 'success':
      default:
        return {
          Icon: CheckCircle,
          color: Colors.green,
          lighterColor: Colors.greenLighter,
        };
    }
  };
  
  const theme = getThemeStyles();

  if (!visible) return null;

  const handleClose = onCancel || onConfirm;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.iconContainer, { backgroundColor: theme.lighterColor }]}>
            <theme.Icon size={32} color={theme.color} />
          </View>
          <Text style={styles.title}>
            {title}
          </Text>
          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.buttonContainer}>
            {showCancel && onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton,
                { backgroundColor: theme.color, shadowColor: theme.color },
                !showCancel && { flex: 0.8 } // Make button smaller if it's the only one
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default SuccessBox;