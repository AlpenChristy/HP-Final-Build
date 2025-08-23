// File: core/services/deliveryAuthService.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';
import { SessionManager, UserSession } from '../session/sessionManager';

export const deliveryAuthService = {
  // Authenticate delivery agent with email and password
  async authenticateDeliveryAgent(email: string, password: string): Promise<UserSession | null> {
    try {
      // Query the unified users collection for delivery role
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('email', '==', email),
        where('role', '==', 'delivery')
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        throw new Error('Invalid email or password');
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data() as any;

      // Check password (NOTE: plaintext per existing flow; should be hashed in production)
      if (userData.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Check if agent is active
      if (userData.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      // Create user session
      const userSession: UserSession = {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        role: 'delivery',
        sessionToken: SessionManager.generateSessionToken(),
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      return userSession;
    } catch (error: any) {
      throw error;
    }
  },

  // Authenticate delivery agent with phone number and password
  async authenticateDeliveryAgentByPhone(phoneNumber: string, password: string): Promise<UserSession | null> {
    try {
      // Query the unified users collection for delivery role with phone number
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('phoneNumber', '==', phoneNumber),
        where('role', '==', 'delivery')
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        throw new Error('Invalid phone number or password');
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data() as any;

      // Check password (NOTE: plaintext per existing flow; should be hashed in production)
      if (userData.password !== password) {
        throw new Error('Invalid phone number or password');
      }

      // Check if agent is active
      if (userData.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      // Create user session
      const userSession: UserSession = {
        uid: userDoc.id,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        displayName: userData.displayName,
        role: 'delivery',
        sessionToken: SessionManager.generateSessionToken(),
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      return userSession;
    } catch (error: any) {
      throw error;
    }
  },

  // Check if email exists in delivery credentials
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('email', '==', email),
        where('role', '==', 'delivery')
      );

      const usersSnapshot = await getDocs(usersQuery);
      return !usersSnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }
};