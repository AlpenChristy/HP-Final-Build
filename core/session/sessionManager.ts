import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'user_session';

export interface UserSession {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  sessionToken: string;
  loginTime: number;
  expiresAt?: number;
  permissions?: {
    orders?: boolean;
    delivery?: boolean;
    products?: boolean;
  };
}

export class SessionManager {
  /**
   * Save user session to device storage
   */
  static async saveSession(userSession: UserSession): Promise<void> {
    try {
      const sessionData = JSON.stringify(userSession);
      await AsyncStorage.setItem(SESSION_KEY, sessionData);
    } catch (error) {
      console.error('Error saving session:', error);
      throw new Error('Failed to save session');
    }
  }

  /**
   * Get user session from device storage
   */
  static async getSession(): Promise<UserSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData) as UserSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Clear user session from device storage
   */
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
      throw new Error('Failed to clear session');
    }
  }

  /**
   * Check if user has a valid session
   */
  static async hasValidSession(): Promise<boolean> {
    try {
      const session = await SessionManager.getSession();
      if (!session) return false;
      
      // Check if session has expired (if expiresAt is set)
      if (session.expiresAt && Date.now() > session.expiresAt) {
        await SessionManager.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Generate a session token (simple implementation)
   */
  static generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}