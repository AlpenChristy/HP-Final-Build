// File: core/services/subAdminService.ts
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_DB, firebaseConfig } from '../firebase/firebase';
import { userService } from './userService';

// Use secondary app to create sub-admin auth users without affecting current admin session
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

// Sub-admin permissions interface
export interface SubAdminPermissions {
  orders: boolean;
  delivery: boolean;
  products: boolean;
}

// Sub-admin data interface
export interface SubAdminData {
  uid: string;
  email?: string;
  displayName: string;
  phoneNumber?: string;
  role: 'sub-admin';
  permissions: SubAdminPermissions;
  createdBy: string; // Admin UID who created this sub-admin
  passwordChangedAt?: number; // Timestamp when password was last changed
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export const subAdminService = {
  // Create a new sub-admin user
  async createSubAdmin(
    adminUid: string,
    subAdminData: {
      email?: string;
      password: string;
      displayName: string;
      phoneNumber?: string;
      permissions: SubAdminPermissions;
    }
  ): Promise<string> {
    try {
      const timestamp = Date.now();

      // Validate that at least one contact method is provided
      if (!subAdminData.email && !subAdminData.phoneNumber) {
        throw new Error('Either email or phone number is required');
      }

      // Validate unique email if provided
      if (subAdminData.email) {
        const existingEmailUser = await this.checkEmailExists(subAdminData.email);
        if (existingEmailUser) {
          throw new Error('Email address is already registered');
        }
      }

      // Validate unique phone if provided
      if (subAdminData.phoneNumber) {
        const existingPhoneUser = await this.checkPhoneExists(subAdminData.phoneNumber);
        if (existingPhoneUser) {
          throw new Error('Phone number is already registered');
        }
      }

      // 1) Create Firebase Auth user via secondary instance (prevents admin sign-out)
      let user;
      if (subAdminData.email) {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(
          secondaryAuth,
          subAdminData.email,
          subAdminData.password
        );
        user = firebaseUser;
        
        // Update Firebase Auth profile with displayName
        await updateProfile(firebaseUser, {
          displayName: subAdminData.displayName
        });
      } else {
        // If no email, we need to create a custom UID for phone-only sub-admins
        const customUid = `phone_subadmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        user = { uid: customUid } as any;
      }

      // 2) Create user doc in unified users collection
      const userData: any = {
        uid: user.uid,
        displayName: subAdminData.displayName,
        role: 'sub-admin',
      };
      
      // Only add email and phone if they are provided (not undefined)
      if (subAdminData.email) {
        userData.email = subAdminData.email;
      }
      if (subAdminData.phoneNumber) {
        userData.phoneNumber = subAdminData.phoneNumber;
      }
      
      await userService.createUser(userData);

      // 3) Add sub-admin specific fields on the same users doc
      const userRef = doc(FIREBASE_DB, 'users', user.uid);
      await updateDoc(userRef, {
        permissions: subAdminData.permissions,
        isActive: true,
        createdBy: adminUid,
        passwordChangedAt: timestamp, // Set initial password change timestamp
        // Optionally retain password field to match existing flows; safe practice is to REMOVE or hash
        password: subAdminData.password,
        updatedAt: timestamp,
      });

      // 4) Sign out secondary auth to clean up (only if we created a Firebase Auth user)
      if (subAdminData.email) {
        await signOut(secondaryAuth);
      }

      return user.uid;
    } catch (error) {
      console.error('Error creating sub-admin:', error);
      
      // Handle specific errors
      if ((error as any).code === 'permission-denied') {
        throw new Error('Permission denied. Please check your admin privileges.');
      }
      
      throw new Error('Failed to create sub-admin');
    }
  },

  // Get all sub-admins created by a specific admin
  async getSubAdminsByAdmin(adminUid: string): Promise<SubAdminData[]> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'users'),
        where('role', '==', 'sub-admin'),
        where('createdBy', '==', adminUid),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const subAdmins: SubAdminData[] = [];
      
      querySnapshot.forEach((doc) => {
        const d = doc.data() as any;
        subAdmins.push({
          uid: doc.id,
          email: d.email,
          displayName: d.displayName,
          phoneNumber: d.phoneNumber,
          role: 'sub-admin',
          permissions: d.permissions,
          createdBy: d.createdBy,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          isActive: d.isActive,
        });
      });
      
      return subAdmins;
    } catch (error) {
      console.error('Error getting sub-admins:', error);
      return [];
    }
  },

  // Get sub-admin data by UID
  async getSubAdminById(uid: string): Promise<SubAdminData | null> {
    try {
      const docSnapRef = doc(FIREBASE_DB, 'users', uid);
      const snap = await getDoc(docSnapRef);
      if (!snap.exists()) return null;
      const d = snap.data() as any;
      if (d.role !== 'sub-admin' || d.isActive === false) return null;
      return {
        uid: uid,
        email: d.email,
        displayName: d.displayName,
        phoneNumber: d.phoneNumber,
        role: 'sub-admin',
        permissions: d.permissions,
        createdBy: d.createdBy,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        isActive: d.isActive,
      };
    } catch (error) {
      console.error('Error getting sub-admin:', error);
      return null;
    }
  },

  // Update sub-admin permissions
  async updateSubAdminPermissions(
    uid: string,
    permissions: SubAdminPermissions
  ): Promise<void> {
    try {
      const subAdminRef = doc(FIREBASE_DB, 'users', uid);
      await updateDoc(subAdminRef, {
        permissions,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating sub-admin permissions:', error);
      throw error;
    }
  },

  // Update sub-admin profile
  async updateSubAdminProfile(
    uid: string,
    profileData: {
      displayName?: string;
      phoneNumber?: string;
      email?: string;
    }
  ): Promise<void> {
    try {
      // Validate unique phone if being updated and not empty
      if (profileData.phoneNumber !== undefined && profileData.phoneNumber.trim() !== '') {
        const existingPhoneUser = await this.checkPhoneExistsExcludingUser(uid, profileData.phoneNumber);
        if (existingPhoneUser) {
          throw new Error('Phone number is already registered by another user');
        }
      }

      // Validate unique email if being updated
      if (profileData.email !== undefined && profileData.email.trim() !== '') {
        const existingEmailUser = await this.checkEmailExistsExcludingUser(uid, profileData.email);
        if (existingEmailUser) {
          throw new Error('Email address is already registered by another user');
        }
      }

      // Update in users collection with proper field handling
      const userRef = doc(FIREBASE_DB, 'users', uid);
      const payload: any = { updatedAt: Date.now() };
      
      if (profileData.displayName !== undefined) payload.displayName = profileData.displayName;
      if (profileData.phoneNumber !== undefined) {
        // Handle phone number - if empty string, remove the field from Firestore
        if (profileData.phoneNumber.trim() === '') {
          payload.phoneNumber = deleteField(); // This will remove the field from Firestore
        } else {
          payload.phoneNumber = profileData.phoneNumber.trim();
        }
      }
      if (profileData.email !== undefined) {
        // Handle email - if empty string, remove the field from Firestore
        if (profileData.email.trim() === '') {
          payload.email = deleteField(); // This will remove the field from Firestore
        } else {
          payload.email = profileData.email.trim();
        }
      }
      
      await updateDoc(userRef, payload);
    } catch (error) {
      console.error('Error updating sub-admin profile:', error);
      throw error;
    }
  },

  // Change sub-admin password (this will force logout)
  async changeSubAdminPassword(uid: string, newPassword: string): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // 1. Get current user data BEFORE updating (to get the old password)
      const userRef = doc(FIREBASE_DB, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('Sub-admin not found');
      }
      
      const userData = userDoc.data() as any;
      const email = userData.email;
      const oldPassword = userData.password;
      
      if (!email || !oldPassword) {
        throw new Error('Email or password not found in user data');
      }

      // 2. Update Firebase Auth password using secondary auth FIRST
      try {
        // Sign in with old password to get current user
        await signInWithEmailAndPassword(secondaryAuth, email, oldPassword);
        
        // Update password in Firebase Auth
        if (secondaryAuth.currentUser) {
          await (secondaryAuth.currentUser as any).updatePassword(newPassword);
        }
      } catch (authError) {
        console.warn('Warning: Failed to update Firebase Auth password:', authError);
        // Continue anyway as the Firestore update is more important for session invalidation
      } finally {
        try { await signOut(secondaryAuth); } catch {}
      }

      // 3. Update the password and passwordChangedAt timestamp in Firestore
      await updateDoc(userRef, {
        password: newPassword,
        passwordChangedAt: timestamp, // This will invalidate all existing sessions
        updatedAt: timestamp,
      });

    } catch (error) {
      console.error('Error changing sub-admin password:', error);
      throw new Error('Failed to change sub-admin password');
    }
  },

  // Deactivate sub-admin (soft delete)
  async deactivateSubAdmin(uid: string): Promise<void> {
    try {
      const subAdminRef = doc(FIREBASE_DB, 'users', uid);
      await updateDoc(subAdminRef, { isActive: false, updatedAt: Date.now() });
    } catch (error) {
      console.error('Error deactivating sub-admin:', error);
      throw error;
    }
  },

  // Check if email already exists in the database
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(FIREBASE_DB, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Failed to validate email uniqueness');
    }
  },

  // Check if phone number already exists in the database
  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const usersRef = collection(FIREBASE_DB, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phone));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking phone existence:', error);
      throw new Error('Failed to validate phone uniqueness');
    }
  },

  // Check if phone number exists excluding a specific user (for updates)
  async checkPhoneExistsExcludingUser(excludeUid: string, phone: string): Promise<boolean> {
    try {
      // If phone is empty, no conflict
      if (!phone || phone.trim() === '') {
        return false;
      }
      
      const usersRef = collection(FIREBASE_DB, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phone));
      const snapshot = await getDocs(q);
      
      // Check if any user other than the excluded one has this phone number
      const conflictingUser = snapshot.docs.find(doc => doc.id !== excludeUid);
      return !!conflictingUser;
    } catch (error) {
      console.error('Error checking phone existence excluding user:', error);
      throw new Error('Failed to validate phone uniqueness');
    }
  },

  // Check if email exists excluding a specific user (for updates)
  async checkEmailExistsExcludingUser(excludeUid: string, email: string): Promise<boolean> {
    try {
      // If email is empty, no conflict
      if (!email || email.trim() === '') {
        return false;
      }
      
      const usersRef = collection(FIREBASE_DB, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      // Check if any user other than the excluded one has this email
      const conflictingUser = snapshot.docs.find(doc => doc.id !== excludeUid);
      return !!conflictingUser;
    } catch (error) {
      console.error('Error checking email existence excluding user:', error);
      throw new Error('Failed to validate email uniqueness');
    }
  },

  // Delete sub-admin permanently
  async deleteSubAdmin(uid: string): Promise<void> {
    try {
      const userRef = doc(FIREBASE_DB, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        const email = data.email;
        const password = data.password; // per existing flow

        // Try to delete Auth user by signing in on secondary auth
        if (email && password) {
          try {
            await signInWithEmailAndPassword(secondaryAuth, email, password);
            if (secondaryAuth.currentUser) {
              await deleteUser(secondaryAuth.currentUser);
            }
          } catch (authErr) {
            console.warn('Warning: Failed to delete Firebase Auth user for sub-admin:', authErr);
          } finally {
            try { await signOut(secondaryAuth); } catch {}
          }
        }
      }

      // Delete Firestore user document
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      throw error;
    }
  },

  // Check if user has specific permission
  hasPermission(subAdmin: SubAdminData, permission: keyof SubAdminPermissions): boolean {
    return subAdmin.permissions[permission] === true;
  },

  // Get allowed screens for sub-admin based on permissions
  getAllowedScreens(permissions: SubAdminPermissions): string[] {
    const allowedScreens: string[] = [];
    
    if (permissions.orders) allowedScreens.push('orders');
    if (permissions.products) allowedScreens.push('products');
    if (permissions.delivery) allowedScreens.push('delivery');
    
    return allowedScreens;
  },
};