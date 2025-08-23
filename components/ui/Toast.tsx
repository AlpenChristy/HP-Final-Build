import { AlertTriangle, Check, X as CloseIcon, Info, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export interface ToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  onPress?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  type,
  title,
  message,
  duration = 4000,
  onClose,
  onPress,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: Colors.primary,
          icon: Check,
          iconColor: Colors.primary,
          textColor: Colors.text,
          messageColor: Colors.textSecondary,
        };
      case 'error':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#DC2626',
          icon: X,
          iconColor: '#DC2626',
          textColor: Colors.text,
          messageColor: Colors.textSecondary,
        };
      case 'warning':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#F59E0B',
          icon: AlertTriangle,
          iconColor: '#F59E0B',
          textColor: Colors.text,
          messageColor: Colors.textSecondary,
        };
      case 'info':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: Colors.primary,
          icon: Info,
          iconColor: Colors.primary,
          textColor: Colors.text,
          messageColor: Colors.textSecondary,
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderColor: Colors.primary,
          icon: Info,
          iconColor: Colors.primary,
          textColor: Colors.text,
          messageColor: Colors.textSecondary,
        };
    }
  };

  const toastStyles = getToastStyles();
  const IconComponent = toastStyles.icon;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          backgroundColor: toastStyles.backgroundColor,
          borderColor: toastStyles.borderColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: type === 'error' 
              ? 'rgba(220, 38, 38, 0.1)' 
              : type === 'warning'
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(13, 71, 161, 0.1)'
          }
        ]}>
          <IconComponent size={20} color={toastStyles.iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: toastStyles.textColor }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: toastStyles.messageColor }]}>{message}</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.closeButton,
            { 
              backgroundColor: type === 'error' 
                ? 'rgba(220, 38, 38, 0.1)' 
                : type === 'warning'
                ? 'rgba(245, 158, 11, 0.1)'
                : 'rgba(13, 71, 161, 0.1)'
            }
          ]}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseIcon size={16} color={toastStyles.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: StatusBar.currentHeight || 44,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 60,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Toast;
