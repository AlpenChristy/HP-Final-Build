// File: core/services/deliveryAgentService.ts

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebase/firebase';
import { firebaseConfig } from '../firebase/firebase'; // adjust path if needed
import { userService } from './userService';

// --- Secondary Firebase app for creating accounts without logging out admin ---
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

// Delivery Agent interface
export interface DeliveryAgent {
  id?: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'delivery';
  isActive: boolean;
  deliveriesThisWeek?: number;
  remainingToday?: number;
  totalAllotted?: number;
  createdAt: number;
  updatedAt: number;
}

export const deliveryAgentService = {
  // Create a new delivery agent in Firebase Auth + Firestore without logging out admin
  async createDeliveryAgent(agentData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<DeliveryAgent> {
    try {
      const timestamp = Date.now();

      // 1. Create account in Firebase Auth using secondary instance
      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        agentData.email,
        agentData.password
      );

      // 2. Create base user document in unified users collection
      await userService.createUser({
        uid: user.uid,
        email: agentData.email,
        displayName: agentData.name,
        phoneNumber: agentData.phone,
        role: 'delivery',
      });

      // 3. Add delivery-specific fields on the same users doc
      const userRef = doc(FIREBASE_DB, 'users', user.uid);
      await updateDoc(userRef, {
        // Warning: storing plaintext password is insecure; retained to match existing flow
        password: agentData.password,
        isActive: true,
        deliveriesThisWeek: 0,
        remainingToday: 0,
        totalAllotted: 0,
        updatedAt: timestamp,
      });

      // 5. Sign out secondary auth to clean up
      await signOut(secondaryAuth);

      // 4. Build return object from users doc
      const createdSnap = await getDoc(userRef);
      const data = createdSnap.data() as any;
      const deliveryAgent: DeliveryAgent = {
        id: user.uid,
        uid: user.uid,
        name: data.displayName || agentData.name,
        email: data.email || agentData.email,
        phone: data.phoneNumber || agentData.phone,
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
          email: d.email || '',
          phone: d.phoneNumber || '',
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
      const userRef = doc(FIREBASE_DB, 'users', uid);
      const payload: any = { updatedAt: Date.now() };
      if (updateData.name !== undefined) payload.displayName = updateData.name;
      if (updateData.phone !== undefined) payload.phoneNumber = updateData.phone;
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

  // Delete delivery agent (Firestore only — Auth deletion requires server/Admin SDK)
  async deleteDeliveryAgent(uid: string): Promise<void> {
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
            console.warn('Warning: Failed to delete Firebase Auth user for delivery agent:', authErr);
          } finally {
            try { await signOut(secondaryAuth); } catch {}
          }
        }
      }

      // Delete Firestore user document
      await deleteDoc(userRef);
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
};
