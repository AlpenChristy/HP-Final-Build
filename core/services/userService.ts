// File: core/services/userService.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';

// User data interface
export interface UserData {
  uid: string;
  email?: string;
  displayName: string;
  role: string;
  phoneNumber?: string;
  address?: string;
  consumerNumber?: string;
  passwordChangedAt?: number; // Timestamp when password was last changed
  createdAt: number;
  updatedAt: number;
}

export const userService = {
  // Create a new user in Firestore
  async createUser(userData: Partial<UserData>): Promise<void> {
    if (!userData.uid) throw new Error('User ID is required');
    
    const timestamp = Date.now();
    const userRef = doc(FIREBASE_DB, 'users', userData.uid);
    
    await setDoc(userRef, {
      ...userData,
      role: userData.role || 'customer', // Default role
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
  
  // Get user data from Firestore
  async getUserById(uid: string): Promise<UserData | null> {
    try {
      const userRef = doc(FIREBASE_DB, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },
  
  // Update user data in Firestore
  async updateUser(uid: string, userData: Partial<UserData>): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: Date.now(),
    });
  },
  
  // Update user role
  async updateUserRole(uid: string, role: string): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', uid);
    await updateDoc(userRef, {
      role,
      updatedAt: Date.now(),
    });
  }
};
