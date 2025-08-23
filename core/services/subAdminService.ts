// File: core/services/subAdminService.ts
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
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
  email: string;
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
      email: string;
      password: string;
      displayName: string;
      phoneNumber?: string;
      permissions: SubAdminPermissions;
    }
  ): Promise<string> {
    try {
      const timestamp = Date.now();

      // 1) Create Firebase Auth user via secondary instance (prevents admin sign-out)
      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        subAdminData.email,
        subAdminData.password
      );

      // 2) Create user doc in unified users collection
      await userService.createUser({
        uid: user.uid,
        email: subAdminData.email,
        displayName: subAdminData.displayName,
        phoneNumber: subAdminData.phoneNumber,
        role: 'sub-admin',
      });

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

      // 4) Sign out secondary auth to clean up
      await signOut(secondaryAuth);

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
    }
  ): Promise<void> {
    try {
      // Update in users collection only
      await userService.updateUser(uid, { ...profileData });
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
          console.log('Firebase Auth password updated successfully');
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

      console.log(`Password changed for sub-admin ${uid} at ${timestamp}`);
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