// File: core/services/deliveryAgentService.ts

import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';
import { userService } from './userService';

// Firebase Auth removed: operations are Firestore-only.

// Delivery Agent interface
export interface DeliveryAgent {
  id?: string;
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'delivery';
  isActive: boolean;
  deliveriesThisWeek?: number;
  remainingToday?: number;
  totalAllotted?: number;
  passwordChangedAt?: number; // Timestamp when password was last changed
  createdAt: number;
  updatedAt: number;
}

export const deliveryAgentService = {
  // Create a new delivery agent in Firestore without logging out admin
  async createDeliveryAgent(agentData: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
  }): Promise<DeliveryAgent> {
    try {
      const timestamp = Date.now();

      // Validate that at least one contact method is provided
      if (!agentData.email && !agentData.phone) {
        throw new Error('Either email or phone number is required');
      }

      // Validate unique email if provided
      if (agentData.email) {
        const existingEmailUser = await this.checkEmailExists(agentData.email);
        if (existingEmailUser) {
          throw new Error('Email address is already registered');
        }
      }

      // Validate unique phone if provided
      if (agentData.phone) {
        const existingPhoneUser = await this.checkPhoneExists(agentData.phone);
        if (existingPhoneUser) {
          throw new Error('Phone number is already registered');
        }
      }

      // Generate a custom UID (no Firebase Auth)
      const uid = `delivery_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // 2. Create base user document in unified users collection
      const userData: any = {
        uid,
        displayName: agentData.name,
        role: 'delivery',
      };
      
      // Only add email and phone if they are provided (not undefined)
      if (agentData.email) {
        userData.email = agentData.email;
      }
      if (agentData.phone) {
        userData.phoneNumber = agentData.phone;
      }
      
      await userService.createUser(userData);

      // 3. Add delivery-specific fields on the same users doc
      const userRef = doc(FIREBASE_DB, 'users', uid);
      await updateDoc(userRef, {
        // Warning: storing plaintext password is insecure; retained to match existing flow
        password: agentData.password,
        passwordChangedAt: timestamp, // Set initial password change timestamp
        isActive: true,
        deliveriesThisWeek: 0,
        remainingToday: 0,
        totalAllotted: 0,
        updatedAt: timestamp,
      });

      // 4. Build return object from users doc
      const createdSnap = await getDoc(userRef);
      const data = createdSnap.data() as any;
      const deliveryAgent: DeliveryAgent = {
        id: uid,
        uid,
        name: data.displayName || agentData.name,
        email: data.email || agentData.email || '',
        phone: data.phoneNumber || agentData.phone || '',
        role: 'delivery',
        isActive: data.isActive ?? true,
        deliveriesThisWeek: data.deliveriesThisWeek ?? 0,
        remainingToday: data.remainingToday ?? 0,
        totalAllotted: data.totalAllotted ?? 0,
        createdAt: data.createdAt || timestamp,
        updatedAt: data.updatedAt || timestamp,
      };

      return deliveryAgent;
    } catch (error: any) {
      console.error('Error creating delivery agent:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your admin privileges.');
      }

      throw new Error(error.message || 'Failed to create delivery agent');
    }
  },

  // Get all delivery agents
  async getAllDeliveryAgents(): Promise<DeliveryAgent[]> {
    try {
      const usersRef = collection(FIREBASE_DB, 'users');
      const q = query(usersRef, where('role', '==', 'delivery'));
      const snapshot = await getDocs(q);

             return snapshot.docs.map(docSnap => {
         const d = docSnap.data() as any;
         const agent: DeliveryAgent = {
           id: docSnap.id,
           uid: docSnap.id,
           name: d.displayName || '',
           email: d.email || undefined,
           phone: d.phoneNumber || undefined,
           role: 'delivery',
           isActive: d.isActive ?? true,
           deliveriesThisWeek: d.deliveriesThisWeek ?? 0,
           remainingToday: d.remainingToday ?? 0,
           totalAllotted: d.totalAllotted ?? 0,
           createdAt: d.createdAt || 0,
           updatedAt: d.updatedAt || 0,
         };
         return agent;
       });
    } catch (error) {
      console.error('Error getting delivery agents:', error);
      throw new Error('Failed to fetch delivery agents');
    }
  },

           // Update delivery agent
    async updateDeliveryAgent(uid: string, updateData: Partial<DeliveryAgent>): Promise<void> {
      try {
        // Validate unique phone if being updated and not empty
        if (updateData.phone !== undefined && updateData.phone.trim() !== '') {
          const existingPhoneUser = await this.checkPhoneExistsExcludingUser(uid, updateData.phone);
          if (existingPhoneUser) {
            throw new Error('Phone number is already registered by another user');
          }
        }

        // Validate unique email if being updated
        if (updateData.email !== undefined && updateData.email.trim() !== '') {
          const existingEmailUser = await this.checkEmailExistsExcludingUser(uid, updateData.email);
          if (existingEmailUser) {
            throw new Error('Email address is already registered by another user');
          }
        }

        const userRef = doc(FIREBASE_DB, 'users', uid);
        const payload: any = { updatedAt: Date.now() };
        if (updateData.name !== undefined) payload.displayName = updateData.name;
        if (updateData.phone !== undefined) {
          // Handle phone number - if empty string, remove the field from Firestore
          if (updateData.phone.trim() === '') {
            payload.phoneNumber = deleteField(); // This will remove the field from Firestore
          } else {
            payload.phoneNumber = updateData.phone.trim();
          }
        }
        if (updateData.email !== undefined) {
          // Handle email - if empty string, remove the field from Firestore
          if (updateData.email.trim() === '') {
            payload.email = deleteField(); // This will remove the field from Firestore
          } else {
            payload.email = updateData.email.trim();
          }
        }
        if (updateData.isActive !== undefined) payload.isActive = updateData.isActive;
        if (updateData.deliveriesThisWeek !== undefined) payload.deliveriesThisWeek = updateData.deliveriesThisWeek;
        if (updateData.remainingToday !== undefined) payload.remainingToday = updateData.remainingToday;
        if (updateData.totalAllotted !== undefined) payload.totalAllotted = updateData.totalAllotted;
        await updateDoc(userRef, payload);
     } catch (error) {
       console.error('Error updating delivery agent:', error);
       throw new Error('Failed to update delivery agent');
     }
   },

  // Change delivery agent password (this will force logout)
  async changeDeliveryAgentPassword(uid: string, newPassword: string): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // 1. Update the password and passwordChangedAt timestamp in Firestore
      const userRef = doc(FIREBASE_DB, 'users', uid);
      await updateDoc(userRef, {
        password: newPassword,
        passwordChangedAt: timestamp, // This will invalidate all existing sessions
        updatedAt: timestamp,
      });
    } catch (error) {
      console.error('Error changing delivery agent password:', error);
      throw new Error('Failed to change delivery agent password');
    }
  },

  // Delete delivery agent (Firestore only — Auth deletion requires server/Admin SDK)
  async deleteDeliveryAgent(uid: string): Promise<void> {
    try {
      // Delete Firestore user document
      await deleteDoc(doc(FIREBASE_DB, 'users', uid));
    } catch (error) {
      console.error('Error deleting delivery agent:', error);
      throw new Error('Failed to delete delivery agent');
    }
  },

  // Toggle agent active status
  async toggleAgentStatus(uid: string, isActive: boolean): Promise<void> {
    try {
      const userRef = doc(FIREBASE_DB, 'users', uid);
      await updateDoc(userRef, { isActive, updatedAt: Date.now() });
    } catch (error) {
      console.error('Error toggling agent status:', error);
      throw new Error('Failed to update agent status');
    }
  },

     // Update delivery statistics
   async updateDeliveryStats(uid: string, stats: {
     deliveriesThisWeek?: number;
     remainingToday?: number;
     totalAllotted?: number;
   }): Promise<void> {
     try {
       const userRef = doc(FIREBASE_DB, 'users', uid);
       await updateDoc(userRef, { ...stats, updatedAt: Date.now() });
     } catch (error) {
       console.error('Error updating delivery stats:', error);
       throw new Error('Failed to update delivery statistics');
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
 };
