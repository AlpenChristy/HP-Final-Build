import { getFunctions, httpsCallable } from 'firebase/functions';
import { FIREBASE_APP } from '../firebase/firebase';

const functions = getFunctions(FIREBASE_APP);

// Cloud function references
const sendOTPFunction = httpsCallable(functions, 'sendOTP');
const verifyOTPFunction = httpsCallable(functions, 'verifyOTP');
const verifyPasswordResetOTPFunction = httpsCallable(functions, 'verifyPasswordResetOTP');
const sendPasswordResetOTPFunction = httpsCallable(functions, 'sendPasswordResetOTP');


export interface OTPResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface OTPVerificationResponse {
  valid: boolean;
  message: string;
}



export class WhatsAppOtpService {
  /**
   * Send OTP to a phone number via WhatsApp
   * @param phoneNumber - Phone number in international format (e.g., "919876543210")
   * @returns Promise<OTPResponse>
   */
  static async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      const result = await sendOTPFunction({ phoneNumber });
      return result.data as OTPResponse;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }
  }

  /**
   * Verify OTP for a phone number
   * @param phoneNumber - Phone number in international format
   * @param otp - The OTP to verify
   * @returns Promise<OTPVerificationResponse>
   */
  static async verifyOTP(phoneNumber: string, otp: string): Promise<OTPVerificationResponse> {
    try {
      const result = await verifyOTPFunction({ phoneNumber, otp });
      return result.data as OTPVerificationResponse;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP');
    }
  }

  /**
   * Verify OTP for password reset (no authentication required)
   * @param otp - The OTP to verify
   * @param phoneNumber - Phone number in international format
   * @returns Promise<OTPVerificationResponse>
   */
  static async verifyPasswordResetOTP(
    otp: string, 
    phoneNumber: string
  ): Promise<OTPVerificationResponse> {
    try {
      console.log('WhatsAppOtpService.verifyPasswordResetOTP called with:', { otp, phoneNumber });
      
      const data = { otp, phoneNumber };

      console.log('Calling Firebase function with data:', data);
      const result = await verifyPasswordResetOTPFunction(data);
      console.log('Firebase function result:', result.data);
      
      return result.data as OTPVerificationResponse;
    } catch (error: any) {
      console.error('Error verifying password reset OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP');
    }
  }

  /**
   * Send password reset OTP via WhatsApp
   * @param phoneNumber - Phone number in international format
   * @returns Promise<OTPResponse>
   */
  static async sendPasswordResetOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      console.log('WhatsAppOtpService.sendPasswordResetOTP called with:', { phoneNumber });
      
      const data = { phoneNumber };

      console.log('Calling Firebase function with data:', data);
      const result = await sendPasswordResetOTPFunction(data);
      console.log('Firebase function result:', result.data);
      
      return result.data as OTPResponse;
    } catch (error: any) {
      console.error('Error sending password reset OTP:', error);
      throw new Error(error.message || 'Failed to send password reset OTP');
    }
  }



  /**
   * Format phone number to international format
   * @param phoneNumber - Phone number to format
   * @returns Formatted phone number
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 0, remove it
    if (cleaned.startsWith('0')) {
      return cleaned.substring(1);
    }
    
    // If it doesn't start with country code (91 for India), add it
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   * @returns boolean
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const phoneRegex = /^[1-9]\d{1,14}$/;
    return phoneRegex.test(formatted);
  }
}
