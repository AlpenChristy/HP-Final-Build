// File: core/services/deliveryAgentService.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebase/firebase';
import { userService } from './userService';

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
  // Create a new delivery agent with Firebase Auth registration
  async createDeliveryAgent(agentData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<DeliveryAgent> {
    try {
      // Generate a unique ID for the delivery agent
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      // Create delivery agent data
      const deliveryAgent: DeliveryAgent = {
        uid: agentId,
        name: agentData.name,
        email: agentData.email,
        phone: agentData.phone,
        role: 'delivery',
        isActive: true,
        deliveriesThisWeek: 0,
        remainingToday: 0,
        totalAllotted: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Store in delivery_agents collection
      const agentRef = doc(FIREBASE_DB, 'delivery_agents', agentId);
      await setDoc(agentRef, deliveryAgent);

      // Store credentials in delivery_credentials collection for authentication
      const credentialsRef = doc(FIREBASE_DB, 'delivery_credentials', agentId);
      await setDoc(credentialsRef, {
        uid: agentId,
        email: agentData.email,
        password: agentData.password, // In production, hash this password
        createdAt: timestamp,
      });

      return { ...deliveryAgent, id: agentId };
    } catch (error: any) {
      console.error('Error creating delivery agent:', error);
      
      // Handle specific errors
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your admin privileges.');
      }
      
      throw new Error('Failed to create delivery agent');
    }
  },

  // Get all delivery agents
  async getAllDeliveryAgents(): Promise<DeliveryAgent[]> {
    try {
      const agentsRef = collection(FIREBASE_DB, 'delivery_agents');
      const snapshot = await getDocs(agentsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DeliveryAgent));
    } catch (error) {
      console.error('Error getting delivery agents:', error);
      throw new Error('Failed to fetch delivery agents');
    }
  },

  // Update delivery agent
  async updateDeliveryAgent(uid: string, updateData: Partial<DeliveryAgent>): Promise<void> {
    try {
      const agentRef = doc(FIREBASE_DB, 'delivery_agents', uid);
      await updateDoc(agentRef, {
        ...updateData,
        updatedAt: Date.now(),
      });

      // Also update in users collection if name or phone changed
      if (updateData.name || updateData.phone) {
        await userService.updateUser(uid, {
          displayName: updateData.name,
          phoneNumber: updateData.phone,
        });
      }
    } catch (error) {
      console.error('Error updating delivery agent:', error);
      throw new Error('Failed to update delivery agent');
    }
  },

  // Delete delivery agent
  async deleteDeliveryAgent(uid: string): Promise<void> {
    try {
      // Delete from delivery_agents collection
      const agentRef = doc(FIREBASE_DB, 'delivery_agents', uid);
      await deleteDoc(agentRef);

      // Note: We don't delete from Firebase Auth or users collection
      // Instead, we could deactivate the user or change their role
      await userService.updateUser(uid, {
        role: 'inactive',
      });
    } catch (error) {
      console.error('Error deleting delivery agent:', error);
      throw new Error('Failed to delete delivery agent');
    }
  },

  // Toggle agent active status
  async toggleAgentStatus(uid: string, isActive: boolean): Promise<void> {
    try {
      const agentRef = doc(FIREBASE_DB, 'delivery_agents', uid);
      await updateDoc(agentRef, {
        isActive,
        updatedAt: Date.now(),
      });
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
      const agentRef = doc(FIREBASE_DB, 'delivery_agents', uid);
      await updateDoc(agentRef, {
        ...stats,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating delivery stats:', error);
      throw new Error('Failed to update delivery statistics');
    }
  }
};