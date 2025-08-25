// File: core/services/userService.ts
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  password?: string; // Password field for Firestore
  passwordChangedAt?: number; // Timestamp when password was last changed
  lastLoginAt?: number; // Timestamp when user last logged in
  isActive?: boolean; // Whether the user account is active
  createdAt: number;
  updatedAt: number;
}

export const userService = {
  // Create a new user in Firestore
  async createUser(userData: Partial<UserData>): Promise<void> {
    if (!userData.uid) throw new Error('User ID is required');
    
    const timestamp = Date.now();
    const userRef = doc(FIREBASE_DB, 'users', userData.uid);
    
    // Filter out undefined values to prevent Firestore errors
    const cleanUserData: any = {};
    Object.keys(userData).forEach(key => {
      if (userData[key as keyof UserData] !== undefined) {
        cleanUserData[key] = userData[key as keyof UserData];
      }
    });
    
    await setDoc(userRef, {
      ...cleanUserData,
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
  },
  
  // Update user password in Firestore
  async updateUserPassword(uid: string, password: string): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', uid);
    await updateDoc(userRef, {
      password,
      passwordChangedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },

  // Find user by phone number
  async getUserByPhoneNumber(phoneNumber: string): Promise<UserData | null> {
    try {
      const usersQuery = query(
        collection(FIREBASE_DB, 'users'),
        where('phoneNumber', '==', phoneNumber)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        return null;
      }
      
      // Return the first user found (assuming phone numbers are unique)
      const userDoc = usersSnapshot.docs[0];
      return { uid: userDoc.id, ...userDoc.data() } as UserData;
    } catch (error) {
      console.error('Error finding user by phone number:', error);
      return null;
    }
  },

  // Get all users
  async getAllUsers(): Promise<UserData[]> {
    try {
      const usersQuery = query(collection(FIREBASE_DB, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const users: UserData[] = [];
      usersSnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
};
