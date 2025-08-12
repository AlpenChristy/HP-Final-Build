// File: core/services/subAdminService.ts
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB, firebaseConfig } from '../firebase/firebase';
import { userService } from './userService';

// Use secondary app to create sub-admin auth users without affecting current admin session
const secondaryApp = initializeApp(firebaseConfig, 'Secondary-SubAdmin');
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