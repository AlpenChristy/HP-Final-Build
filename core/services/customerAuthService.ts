// File: core/services/customerAuthService.ts
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';
import { SessionManager, UserSession } from '../session/sessionManager';

export const customerAuthService = {
  // Authenticate customer with email and password (same pattern as sub-admin/delivery)
  async authenticateByEmail(email: string, password: string): Promise<UserSession | null> {
    try {
      // Query the unified users collection for customer role
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('email', '==', email),
        where('role', '==', 'customer')
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

      // Check if customer is active
      if (userData.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      // Create user session
      const userSession: UserSession = {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        role: 'customer',
        sessionToken: SessionManager.generateSessionToken(),
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        passwordChangedAt: userData.passwordChangedAt || undefined,
      };

      return userSession;
    } catch (error: any) {
      console.error('Error authenticating customer by email:', error);
      throw error;
    }
  },

  // Authenticate customer with phone number and password
  async authenticateByPhone(phoneNumber: string, password: string): Promise<UserSession | null> {
    try {
      // Query the unified users collection for customer role with phone number
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('phoneNumber', '==', phoneNumber),
        where('role', '==', 'customer')
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

      // Check if customer is active
      if (userData.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      // Create user session
      const userSession: UserSession = {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        role: 'customer',
        sessionToken: SessionManager.generateSessionToken(),
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        passwordChangedAt: userData.passwordChangedAt || undefined,
      };

      return userSession;
    } catch (error: any) {
      console.error('Error authenticating customer by phone:', error);
      throw error;
    }
  },

  // Register customer with phone number
  async registerWithPhone(name: string, phoneNumber: string, password: string): Promise<any> {
    try {
      // Check if phone number already exists
      const existingUserQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('phoneNumber', '==', phoneNumber)
      );

      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        throw new Error('Phone number already registered');
      }

      // Create new user document
      const userData = {
        displayName: name,
        phoneNumber: phoneNumber,
        password: password,
        role: 'customer',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(FIREBASE_DB, 'users'), userData);

      return {
        uid: docRef.id,
        ...userData
      };
    } catch (error: any) {
      console.error('Error registering customer with phone:', error);
      throw error;
    }
  },

  // Register customer with email
  async registerWithEmail(name: string, email: string, phoneNumber: string, password: string): Promise<any> {
    try {
      // Check if email already exists
      const existingUserQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('email', '==', email)
      );

      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        throw new Error('Email already registered');
      }

      // Create new user document
      const userData = {
        displayName: name,
        email: email,
        phoneNumber: phoneNumber,
        password: password,
        role: 'customer',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(FIREBASE_DB, 'users'), userData);

      return {
        uid: docRef.id,
        ...userData
      };
    } catch (error: any) {
      console.error('Error registering customer with email:', error);
      throw error;
    }
  },

  // Update customer password
  async updateCustomerPassword(uid: string, newPassword: string): Promise<void> {
    try {
      const userRef = doc(FIREBASE_DB, 'users', uid);
      await updateDoc(userRef, {
        password: newPassword,
        passwordChangedAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error: any) {
      console.error('Error updating customer password:', error);
      throw error;
    }
  }
};
