import { User, Users } from 'lucide-react-native';
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

const { width: screenWidth } = Dimensions.get('window');

export interface ChangeDeliveryAgentBoxProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentAgentName?: string;
  newAgentName?: string;
  orderId?: string;
}

const ChangeDeliveryAgentBox: React.FC<ChangeDeliveryAgentBoxProps> = ({
  visible,
  onConfirm,
  onCancel,
  currentAgentName,
  newAgentName,
  orderId,
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
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
          <View style={styles.iconContainer}>
            <Users size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>
            Change Delivery Agent
          </Text>
          <Text style={styles.message}>
            Are you sure you want to change the delivery agent for order #{orderId} from "{currentAgentName}" to "{newAgentName}"?
          </Text>

          <View style={styles.agentInfoContainer}>
            <View style={styles.agentRow}>
              <User size={16} color={Colors.textSecondary} />
              <Text style={styles.agentLabel}>Current Agent:</Text>
              <Text style={styles.agentName}>{currentAgentName}</Text>
            </View>
            <View style={styles.agentRow}>
              <User size={16} color={Colors.primary} />
              <Text style={styles.agentLabel}>New Agent:</Text>
              <Text style={[styles.agentName, styles.newAgentName]}>{newAgentName}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Users size={16} color={Colors.white} />
              <Text style={styles.confirmButtonText}>Change Agent</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    padding: 28,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  agentInfoContainer: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  newAgentName: {
    color: Colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ChangeDeliveryAgentBox;
