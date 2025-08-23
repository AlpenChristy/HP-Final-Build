// File: core/services/subAdminAuthService.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';
import { SessionManager, UserSession } from '../session/sessionManager';
import { subAdminService } from './subAdminService';

export const subAdminAuthService = {
  // Authenticate sub-admin with email and password
  async authenticateSubAdmin(email: string, password: string): Promise<UserSession | null> {
    try {
      // Query the unified users collection for sub-admin role
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('email', '==', email),
        where('role', '==', 'sub-admin')
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

      // Check if sub-admin is active
      if (userData.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      // Get sub-admin permissions
      const subAdminData = await subAdminService.getSubAdminById(userDoc.id);
      if (!subAdminData) {
        throw new Error('Sub-admin data not found');
      }

      // Create user session
      const userSession: UserSession = {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        role: 'sub-admin',
        sessionToken: SessionManager.generateSessionToken(),
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        passwordChangedAt: userData.passwordChangedAt || undefined,
        permissions: subAdminData.permissions,
      };

      return userSession;
    } catch (error: any) {
      console.error('Error authenticating sub-admin:', error);
      throw error;
    }
  },

  // Authenticate sub-admin with phone number and password
  async authenticateSubAdminByPhone(phone: string, password: string): Promise<UserSession | null> {
    try {
      // Query the unified users collection for sub-admin role with phone number
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('phoneNumber', '==', phone),
        where('role', '==', 'sub-admin')
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

      // Check if sub-admin is active
      if (userData.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      // Get sub-admin permissions
      const subAdminData = await subAdminService.getSubAdminById(userDoc.id);
      if (!subAdminData) {
        throw new Error('Sub-admin data not found');
      }

      // Create user session
      const userSession: UserSession = {
        uid: userDoc.id,
        phoneNumber: userData.phoneNumber,
        displayName: userData.displayName,
        role: 'sub-admin',
        sessionToken: SessionManager.generateSessionToken(),
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        passwordChangedAt: userData.passwordChangedAt || undefined,
        permissions: subAdminData.permissions,
      };

      return userSession;
    } catch (error: any) {
      console.error('Error authenticating sub-admin by phone:', error);
      throw error;
    }
  },

  // Check if email exists in sub-admin credentials
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('email', '==', email),
        where('role', '==', 'sub-admin')
      );

      const usersSnapshot = await getDocs(usersQuery);
      return !usersSnapshot.empty;
    } catch (error) {
      console.error('Error checking sub-admin email:', error);
      return false;
    }
  },

  // Check if phone number exists in sub-admin credentials
  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('phoneNumber', '==', phone),
        where('role', '==', 'sub-admin')
      );

      const usersSnapshot = await getDocs(usersQuery);
      return !usersSnapshot.empty;
    } catch (error) {
      console.error('Error checking sub-admin phone:', error);
      return false;
    }
  },
};
