// File: core/services/subAdminService.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebase/firebase';
import { userService } from './userService';

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
    // For now, we'll create the sub-admin record without Firebase Auth
    // This prevents the admin from being signed out
    // The sub-admin can register themselves later using their credentials
    
    try {
      // Generate a unique ID for the sub-admin
      const subAdminId = `subadmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      // Create sub-admin specific document
      const subAdminDoc: SubAdminData = {
        uid: subAdminId,
        email: subAdminData.email,
        displayName: subAdminData.displayName,
        phoneNumber: subAdminData.phoneNumber,
        role: 'sub-admin',
        permissions: subAdminData.permissions,
        createdBy: adminUid,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
      };

      // Store in subAdmins collection
      await setDoc(doc(FIREBASE_DB, 'subAdmins', subAdminId), subAdminDoc);

      // Store credentials for later registration (when sub-admin first logs in)
      const credentialsRef = doc(FIREBASE_DB, 'pending_registrations', subAdminId);
      await setDoc(credentialsRef, {
        email: subAdminData.email,
        password: subAdminData.password, // In production, hash this password
        displayName: subAdminData.displayName,
        phoneNumber: subAdminData.phoneNumber,
        role: 'sub-admin',
        permissions: subAdminData.permissions,
        createdBy: adminUid,
        createdAt: timestamp,
        registrationComplete: false,
      });

      return subAdminId;
    } catch (error) {
      console.error('Error creating sub-admin:', error);
      
      // Handle specific errors
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your admin privileges.');
      }
      
      throw new Error('Failed to create sub-admin');
    }
  },

  // Get all sub-admins created by a specific admin
  async getSubAdminsByAdmin(adminUid: string): Promise<SubAdminData[]> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'subAdmins'),
        where('createdBy', '==', adminUid),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const subAdmins: SubAdminData[] = [];
      
      querySnapshot.forEach((doc) => {
        subAdmins.push(doc.data() as SubAdminData);
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
      const subAdminDoc = await getDocs(query(
        collection(FIREBASE_DB, 'subAdmins'), 
        where('uid', '==', uid),
        where('isActive', '==', true)
      ));
      
      if (!subAdminDoc.empty) {
        return subAdminDoc.docs[0].data() as SubAdminData;
      }
      return null;
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
      const subAdminRef = doc(FIREBASE_DB, 'subAdmins', uid);
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
      // Update in users collection
      await userService.updateUser(uid, profileData);
      
      // Update in subAdmins collection
      const subAdminRef = doc(FIREBASE_DB, 'subAdmins', uid);
      await updateDoc(subAdminRef, {
        ...profileData,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating sub-admin profile:', error);
      throw error;
    }
  },

  // Deactivate sub-admin (soft delete)
  async deactivateSubAdmin(uid: string): Promise<void> {
    try {
      const subAdminRef = doc(FIREBASE_DB, 'subAdmins', uid);
      await updateDoc(subAdminRef, {
        isActive: false,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error deactivating sub-admin:', error);
      throw error;
    }
  },

  // Delete sub-admin permanently
  async deleteSubAdmin(uid: string): Promise<void> {
    try {
      // Delete from subAdmins collection
      await deleteDoc(doc(FIREBASE_DB, 'subAdmins', uid));
      
      // Note: We don't delete from users collection to maintain data integrity
      // Instead, we could update the role or mark as deleted
      await userService.updateUser(uid, { role: 'deleted' });
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
    
    if (permissions.dashboard) allowedScreens.push('dashboard');
    if (permissions.orders) allowedScreens.push('orders');
    if (permissions.products) allowedScreens.push('products');
    if (permissions.delivery) allowedScreens.push('delivery');
    
    return allowedScreens;
  },
};