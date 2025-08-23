import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useToast } from '../../core/context/ToastContext';

const ToastDemo: React.FC = () => {
  const toast = useToast();

  const showSuccessToast = () => {
    toast.showSuccess('Success!', 'This is a success message with blue border and white background.');
  };

  const showErrorToast = () => {
    toast.showError('Error!', 'This is an error message with red border and white background.');
  };

  const showWarningToast = () => {
    toast.showWarning('Warning!', 'This is a warning message with orange border and white background.');
  };

  const showInfoToast = () => {
    toast.showInfo('Info!', 'This is an info message with blue border and white background.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Toast Notification Demo</Text>
      <Text style={styles.subtitle}>Blue & White Theme for Success/Info</Text>
      <Text style={styles.subtitle}>Red & White Theme for Errors</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.successButton]} onPress={showSuccessToast}>
          <Text style={styles.buttonText}>Show Success Toast</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={showErrorToast}>
          <Text style={styles.buttonText}>Show Error Toast</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={showWarningToast}>
          <Text style={styles.buttonText}>Show Warning Toast</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={showInfoToast}>
          <Text style={styles.buttonText}>Show Info Toast</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
    marginTop: 30,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successButton: {
    backgroundColor: Colors.primary,
  },
  errorButton: {
    backgroundColor: '#DC2626',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  infoButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ToastDemo;
