import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, Mail, Phone, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../core/auth/AuthContext';
import { FIREBASE_AUTH } from '../../core/firebase/firebase';
import { createToastHelpers } from '../../core/utils/toastUtils';

import { customerAuthService } from '../../core/services/customerAuthService';
import { deliveryAuthService } from '../../core/services/deliveryAuthService';
import { subAdminAuthService } from '../../core/services/subAdminAuthService';
import { userService } from '../../core/services/userService';
import { WhatsAppOtpService } from '../../core/services/whatsappOtpService';
import { SessionManager, UserSession } from '../../core/session/sessionManager';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// LoginForm component with icon-based toggle
const LoginForm = ({ 
  usePhoneAuth, 
  setUsePhoneAuth, 
  formData, 
  updateFormData, 
  showPassword, 
  setShowPassword, 
  isLoading, 
  handleSubmit, 
  setForgotPasswordModalVisible 
}: {
  usePhoneAuth: boolean;
  setUsePhoneAuth: (value: boolean) => void;
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  isLoading: boolean;
  handleSubmit: () => void;
  setForgotPasswordModalVisible: (value: boolean) => void;
}) => (
  <>
    <View style={styles.iconToggleContainer}>
      <Text style={styles.iconToggleLabel}>Sign in with</Text>
      <View style={styles.iconToggleButtons}>
        <TouchableOpacity
          style={[styles.iconToggleButton, !usePhoneAuth && styles.activeIconToggle]}
          onPress={() => setUsePhoneAuth(false)}
        >
          <Mail size={20} color={!usePhoneAuth ? Colors.white : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconToggleButton, usePhoneAuth && styles.activeIconToggle]}
          onPress={() => setUsePhoneAuth(true)}
        >
          <Phone size={20} color={usePhoneAuth ? Colors.white : Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.inputContainer}>
      {!usePhoneAuth ? (
        <View style={styles.inputWrapper}>
          <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      ) : (
        <View style={styles.inputWrapper}>
          <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contact Phone Number"
            value={formData.phone}
            onChangeText={(text) => updateFormData('phone', text)}
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      )}

      <View style={styles.inputWrapper}>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password (6+ chars, 1 capital, 1 small)"
            value={formData.password}
            onChangeText={(text) => updateFormData('password', text)}
            secureTextEntry={!showPassword}
            placeholderTextColor={Colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>

    <TouchableOpacity
      style={[styles.submitButton, isLoading && styles.disabledButton]}
      onPress={handleSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <Text style={styles.submitButtonText}>Login</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.forgotPassword}
      onPress={() => setForgotPasswordModalVisible(true)}
    >
      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
    </TouchableOpacity>
  </>
);

// RegisterForm component with phone mandatory and email optional
const RegisterForm = ({ 
  formData, 
  updateFormData, 
  showPassword, 
  setShowPassword, 
  isLoading, 
  handleSubmit 
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  isLoading: boolean;
  handleSubmit: () => void;
}) => (
  <>
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <User size={20} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(text) => updateFormData('name', text)}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Contact Phone Number *"
          value={formData.phone}
          onChangeText={(text) => updateFormData('phone', text)}
          keyboardType="phone-pad"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address (Optional) - Valid format required"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.inputWrapper}>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => updateFormData('password', text)}
            secureTextEntry={!showPassword}
            placeholderTextColor={Colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData('confirmPassword', text)}
          secureTextEntry={true}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
    </View>

    <TouchableOpacity
      style={[styles.submitButton, isLoading && styles.disabledButton]}
      onPress={handleSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <Text style={styles.submitButtonText}>Register</Text>
      )}
    </TouchableOpacity>
  </>
);

// ForgotPasswordModal component moved outside to prevent re-rendering
const ForgotPasswordModal = ({ 
  visible, 
  onClose, 
  step, 
  phone, 
  onPhoneChange, 
  otp, 
  onOtpChange, 
  newPassword, 
  onNewPasswordChange, 
  confirmPassword, 
  onConfirmPasswordChange,
  showPassword,
  onShowPasswordChange,
  showConfirmPassword,
  onShowConfirmPasswordChange,
  isLoading,
  countdown,
  onPhoneSubmit,
  onOtpSubmit,
  onPasswordReset,
  onResendOtp
}: {
  visible: boolean;
  onClose: () => void;
  step: 'phone' | 'otp' | 'password';
  phone: string;
  onPhoneChange: (text: string) => void;
  otp: string;
  onOtpChange: (text: string) => void;
  newPassword: string;
  onNewPasswordChange: (text: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (text: string) => void;
  showPassword: boolean;
  onShowPasswordChange: (show: boolean) => void;
  showConfirmPassword: boolean;
  onShowConfirmPasswordChange: (show: boolean) => void;
  isLoading: boolean;
  countdown: number;
  onPhoneSubmit: () => void;
  onOtpSubmit: () => void;
  onPasswordReset: () => void;
  onResendOtp: () => void;
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Forgot Password</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {step === 'phone' && (
            <View>
              <Text style={styles.modalDescription}>
                Enter your registered phone number to receive a password reset OTP via WhatsApp.
              </Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={phone}
                  onChangeText={onPhoneChange}
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isLoading}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={onPhoneSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View>
              <Text style={styles.modalDescription}>
                Enter the 6-digit OTP sent to your WhatsApp.
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={onOtpChange}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isLoading}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={onOtpSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resendButton, countdown > 0 && { opacity: 0.5 }]}
                onPress={onResendOtp}
                disabled={countdown > 0 || isLoading}
              >
                <Text style={styles.resendButtonText}>
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'password' && (
            <View>
              <Text style={styles.modalDescription}>
                Enter your new password.
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={onNewPasswordChange}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={Colors.textSecondary}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => onShowPasswordChange(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={onConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={Colors.textSecondary}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => onShowConfirmPasswordChange(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={onPasswordReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export default function AuthScreen() {
  const { login } = useAuth();
  const toast = createToastHelpers();
  const [isLogin, setIsLogin] = useState(true);
  const [usePhoneAuth, setUsePhoneAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Forgot password modal state
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('');
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState('');
  const [forgotPasswordShowPassword, setForgotPasswordShowPassword] = useState(false);
  const [forgotPasswordShowConfirmPassword, setForgotPasswordShowConfirmPassword] = useState(false);
  const [forgotPasswordCountdown, setForgotPasswordCountdown] = useState(0);
  const [forgotPasswordIsLoading, setForgotPasswordIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  const validateForm = (): boolean => {
    if (!isLogin) {
      // Registration validation
      if (formData.password !== formData.confirmPassword) {
        toast.showError('Validation Error', 'Passwords do not match.');
        return false;
      }
      if (!formData.name || !formData.password) {
        toast.showError('Validation Error', 'Please fill all required fields for registration.');
        return false;
      }
      if (!formData.phone) {
        toast.showError('Validation Error', 'Please enter your phone number.');
        return false;
      }
      if (formData.password.length < 6) {
        toast.showError('Validation Error', 'Password must be at least 6 characters long.');
        return false;
      }
      
      // Full name validation - make it mandatory
      if (!formData.name.trim()) {
        toast.showError('Validation Error', 'Full name is required.');
        return false;
      }
      
      // Email format validation (only if email is provided)
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.showError('Validation Error', 'Please enter a valid email address.');
          return false;
        }
      }
      
      // Password complexity validation - at least 6 characters with one capital and one small letter
      if (formData.password.length < 6) {
        toast.showError('Validation Error', 'Password must be at least 6 characters long.');
        return false;
      }
      
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      
      if (!hasUpperCase || !hasLowerCase) {
        toast.showError('Validation Error', 'Password must contain at least one capital letter and one small letter.');
        return false;
      }
    } else {
      // Login validation
      if (!formData.password) {
        toast.showError('Validation Error', 'Please enter your password.');
        return false;
      }
      if (!usePhoneAuth && !formData.email) {
        toast.showError('Validation Error', 'Please enter your email or switch to phone login.');
        return false;
      }
      if (usePhoneAuth && !formData.phone) {
        toast.showError('Validation Error', 'Please enter your phone number or switch to email login.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (isLoading || !validateForm()) return;

    setIsLoading(true);

    try {
      let userCredential;
      let userData;

      if (isLogin) {
        if (usePhoneAuth) {
          // Try customer login via phone first
          try {
            const phoneSession = await customerAuthService.authenticateByPhone(formData.phone, formData.password);
            if (phoneSession) {
              await login(phoneSession);
              toast.showLoginSuccess();
              setTimeout(() => {
                if (phoneSession.role === 'admin' || phoneSession.role === 'sub-admin') {
                  router.replace('/admin');
                } else if (phoneSession.role === 'delivery') {
                  router.replace('/delivery/deliverydashboard');
                } else {
                  router.replace('/customer/home');
                }
              }, 300);
              return;
            }
          } catch (customerError) {
            // If customer auth fails, try sub-admin phone auth
            try {
              const subAdminPhoneSession = await subAdminAuthService.authenticateSubAdminByPhone(formData.phone, formData.password);
              if (subAdminPhoneSession) {
                // Ensure the session has expiresAt and passwordChangedAt
                const sessionWithExpiry = {
                  ...subAdminPhoneSession,
                  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                };
                await login(sessionWithExpiry);
                toast.showLoginSuccess();
                setTimeout(() => {
                  router.replace('/admin');
                }, 300);
                return;
              }
            } catch (subAdminError: any) {
              // Check if it's a specific sub-admin error
              if (subAdminError.message.includes('deactivated')) {
                toast.showError('Account Deactivated', 'Your account has been deactivated. Please contact admin.');
                return;
              }
              // Silently continue to next auth method
            }
            
            // If sub-admin auth fails, try delivery agent phone auth
            try {
              const deliveryPhoneSession = await deliveryAuthService.authenticateDeliveryAgentByPhone(formData.phone, formData.password);
              if (deliveryPhoneSession) {
                await login(deliveryPhoneSession);
                toast.showDeliveryAgentLoginSuccess();
                setTimeout(() => {
                  router.replace('/delivery/deliverydashboard');
                }, 300);
                return;
              }
            } catch (deliveryError: any) {
              // Check if it's a specific delivery agent error
              if (deliveryError.message.includes('deactivated')) {
                toast.showDeliveryAgentAccountDeactivated();
                return;
              } else if (deliveryError.message.includes('Invalid phone number')) {
                toast.showDeliveryAgentPhoneNotFound();
                return;
              }
              // If all fail, throw the original customer error
              throw customerError;
            }
          }
        } else {
          // Email-based authentication - use the same pattern as sub-admin and delivery
          try {
            // Try customer authentication first (same pattern as sub-admin/delivery)
            const customerSession = await customerAuthService.authenticateByEmail(formData.email, formData.password);
            if (customerSession) {
              await login(customerSession);
              toast.showLoginSuccess();
              setTimeout(() => {
                router.replace('/customer/home');
              }, 300);
              return;
            }
          } catch (customerError: any) {
            // If customer auth fails, try delivery agent authentication
            try {
              const deliverySession = await deliveryAuthService.authenticateDeliveryAgent(formData.email, formData.password);
              if (deliverySession) {
                await login(deliverySession);
                toast.showDeliveryAgentLoginSuccess();
                setTimeout(() => {
                  router.replace('/delivery/deliverydashboard');
                }, 300);
                return;
              }
            } catch (deliveryError: any) {
              // Check if it's a specific delivery agent error
              if (deliveryError.message.includes('deactivated')) {
                toast.showDeliveryAgentAccountDeactivated();
                return;
              }
              // Silently continue to next auth method
            }
            
            // Try sub-admin authentication
            try {
              const subAdminSession = await subAdminAuthService.authenticateSubAdmin(formData.email, formData.password);
              if (subAdminSession) {
                // Ensure the session has expiresAt
                const sessionWithExpiry = {
                  ...subAdminSession,
                  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                };
                await login(sessionWithExpiry);
                toast.showLoginSuccess();
                setTimeout(() => {
                  router.replace('/admin');
                }, 300);
                return;
              }
            } catch (subAdminError: any) {
              // Check if it's a specific sub-admin error
              if (subAdminError.message.includes('deactivated')) {
                toast.showError('Account Deactivated', 'Your account has been deactivated. Please contact admin.');
                return;
              }
              // Silently continue to next auth method
            }
            
            // If all custom auth methods fail, try Firebase Auth as fallback (for legacy users)
            try {
              userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, formData.email, formData.password);
              // Get user data from Firestore
              userData = await userService.getUserById(userCredential.user.uid);
              
              // Create session for Firebase Auth user
              const emailLoginSession: UserSession = {
                uid: userCredential.user.uid,
                email: userCredential.user.email || formData.email || undefined,
                displayName: userCredential.user.displayName || userData?.displayName || formData.name,
                phoneNumber: userData?.phoneNumber,
                role: userData?.role || 'customer',
                sessionToken: SessionManager.generateSessionToken(),
                loginTime: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                passwordChangedAt: userData?.passwordChangedAt || undefined,
              };

              await login(emailLoginSession);
              toast.showLoginSuccess();
              setTimeout(() => {
                if (emailLoginSession.role === 'admin' || emailLoginSession.role === 'sub-admin') {
                  router.replace('/admin');
                } else if (emailLoginSession.role === 'delivery') {
                  router.replace('/delivery/deliverydashboard');
                } else {
                  router.replace('/customer/home');
                }
              }, 300);
              return;
                         } catch {
               // If all authentication methods fail, throw the original customer error
               throw customerError;
             }
          }
        }
      } else {
        // Registration - always use phone since it's mandatory
        const created = await customerAuthService.registerWithPhone(formData.name, formData.phone, formData.password);
        // Build session for new phone-based user
        const phoneSession: UserSession = {
          uid: created.uid,
          phoneNumber: formData.phone,
          displayName: formData.name,
          role: 'customer',
          sessionToken: SessionManager.generateSessionToken(),
          loginTime: Date.now(),
        };
        await login(phoneSession);
        toast.showRegistrationSuccess();
        setTimeout(() => {
          router.replace('/customer/home');
        }, 300);
        return;
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.showAuthenticationError(error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
  };

  const toggleAuthMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    resetForm();
  };

  // Forgot password modal functions
  const handleForgotPasswordPhoneSubmit = async () => {
    if (!forgotPasswordPhone.trim()) {
      toast.showError('Validation Error', 'Please enter your phone number.');
      return;
    }

    setForgotPasswordIsLoading(true);
    try {
      // Find user by phone number
      const user = await userService.getUserByPhoneNumber(forgotPasswordPhone.trim());
      
      if (!user) {
        toast.showError('User Not Found', 'No account found with this phone number.');
        return;
      }

      setFoundUser(user);
      
      // Format phone number and send OTP
      const formattedPhoneNumber = WhatsAppOtpService.formatPhoneNumber(forgotPasswordPhone.trim());
      await WhatsAppOtpService.sendPasswordResetOTP(formattedPhoneNumber);
      
      setForgotPasswordStep('otp');
      setForgotPasswordCountdown(60); // 60 seconds countdown
      toast.showOtpSentSuccess();
    } catch (error: any) {
      console.error('Error in forgot password:', error);
      toast.showOtpError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setForgotPasswordIsLoading(false);
    }
  };

  const handleForgotPasswordOtpSubmit = async () => {
    if (!forgotPasswordOtp.trim() || forgotPasswordOtp.length !== 6) {
      toast.showInvalidOtpError();
      return;
    }

    setForgotPasswordIsLoading(true);
    try {
      const formattedPhoneNumber = WhatsAppOtpService.formatPhoneNumber(forgotPasswordPhone.trim());
      const result = await WhatsAppOtpService.verifyPasswordResetOTP(forgotPasswordOtp, formattedPhoneNumber);
      
      if (result.valid) {
        setForgotPasswordStep('password');
        toast.showOtpVerifiedSuccess();
      } else {
        toast.showError('Invalid OTP', result.message);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.showOtpVerificationError(error.message);
    } finally {
      setForgotPasswordIsLoading(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    if (!forgotPasswordNewPassword.trim() || forgotPasswordNewPassword.length < 6) {
      toast.showInvalidPasswordError();
      return;
    }

    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      toast.showPasswordMismatchError();
      return;
    }

    setForgotPasswordIsLoading(true);
    try {
      console.log('Found user data:', foundUser);
      
      // Update password in Firestore using customer auth service
      if (foundUser?.uid) {
        await customerAuthService.updateCustomerPassword(foundUser.uid, forgotPasswordNewPassword);
        console.log('Password updated in Firestore');
      }

      // Note: Since we're now using custom authentication (same as sub-admin/delivery),
      // we don't need to update Firebase Auth password anymore. The password is stored
      // in Firestore and used directly for authentication, just like sub-admin and delivery services.

      toast.showPasswordResetSuccess();
      
      // Reset modal state
      setForgotPasswordModalVisible(false);
      setForgotPasswordStep('phone');
      setForgotPasswordPhone('');
      setForgotPasswordOtp('');
      setForgotPasswordNewPassword('');
      setForgotPasswordConfirmPassword('');
      setFoundUser(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.showError('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setForgotPasswordIsLoading(false);
    }
  };

  const handleForgotPasswordResendOTP = async () => {
    if (forgotPasswordCountdown > 0) return;
    
    try {
      await handleForgotPasswordPhoneSubmit();
    } catch {
      // Error already handled in handleForgotPasswordPhoneSubmit
    }
  };

  const resetForgotPasswordModal = () => {
    setForgotPasswordModalVisible(false);
    setForgotPasswordStep('phone');
    setForgotPasswordPhone('');
    setForgotPasswordOtp('');
    setForgotPasswordNewPassword('');
    setForgotPasswordConfirmPassword('');
    setFoundUser(null);
    setForgotPasswordCountdown(0);
  };

  // Countdown effect for forgot password
  React.useEffect(() => {
    let timer: number;
    if (forgotPasswordCountdown > 0) {
      timer = setTimeout(() => setForgotPasswordCountdown(forgotPasswordCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotPasswordCountdown]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/hpgas-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>HP Gas Services</Text>
        <Text style={styles.subtitle}>Vihar Electricals</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, isLogin && styles.activeToggle]}
            onPress={() => toggleAuthMode(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isLogin && styles.activeToggle]}
            onPress={() => toggleAuthMode(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>Register</Text>
          </TouchableOpacity>
        </View>

        {isLogin ? (
          <LoginForm 
            usePhoneAuth={usePhoneAuth}
            setUsePhoneAuth={setUsePhoneAuth}
            formData={formData}
            updateFormData={updateFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
            setForgotPasswordModalVisible={setForgotPasswordModalVisible}
          />
        ) : (
          <RegisterForm 
            formData={formData}
            updateFormData={updateFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Secure and reliable gas delivery service
        </Text>
      </View>
      <ForgotPasswordModal 
        visible={forgotPasswordModalVisible}
        onClose={resetForgotPasswordModal}
        step={forgotPasswordStep}
        phone={forgotPasswordPhone}
        onPhoneChange={setForgotPasswordPhone}
        otp={forgotPasswordOtp}
        onOtpChange={setForgotPasswordOtp}
        newPassword={forgotPasswordNewPassword}
        onNewPasswordChange={setForgotPasswordNewPassword}
        confirmPassword={forgotPasswordConfirmPassword}
        onConfirmPasswordChange={setForgotPasswordConfirmPassword}
        showPassword={forgotPasswordShowPassword}
        onShowPasswordChange={setForgotPasswordShowPassword}
        showConfirmPassword={forgotPasswordShowConfirmPassword}
        onShowConfirmPasswordChange={setForgotPasswordShowConfirmPassword}
        isLoading={forgotPasswordIsLoading}
        countdown={forgotPasswordCountdown}
        onPhoneSubmit={handleForgotPasswordPhoneSubmit}
        onOtpSubmit={handleForgotPasswordOtpSubmit}
        onPasswordReset={handleForgotPasswordReset}
        onResendOtp={handleForgotPasswordResendOTP}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: 85,
    height: 85,
    borderRadius: 15,
    marginTop: 26,
    marginBottom: 0,
    padding: 2,
  },
  title: {
    fontSize: 28,
    marginTop: 0,
    fontWeight: '800',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.white,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 5,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeToggle: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeToggleText: {
    color: Colors.white,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text,
    paddingVertical: 16,
  },
  passwordInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  forgotPassword: {
    alignSelf: 'center',
    padding: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalContent: {
    paddingTop: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  resendButton: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  iconToggleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  iconToggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  iconToggleButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 25,
    padding: 5,
    marginTop: 8,
  },
  iconToggleButton: {
    padding: 8,
    borderRadius: 18,
    marginHorizontal: 3,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconToggle: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
});