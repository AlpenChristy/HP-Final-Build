// File: core/services/notificationService.ts
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';

// Notification data interface
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'order_update' | 'promo' | 'system';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdBy: string; // Admin UID who created this notification
  createdAt: number;
  updatedAt: number;
  expiresAt?: number; // Optional expiration date
}

// Create notification data interface (without id and timestamps)
export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'announcement' | 'order_update' | 'promo' | 'system';
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

// Update notification data interface
export interface UpdateNotificationData {
  title?: string;
  message?: string;
  type?: 'announcement' | 'order_update' | 'promo' | 'system';
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

export const notificationService = {
  // Create a new notification
  async createNotification(adminUid: string, notificationData: CreateNotificationData): Promise<string> {
    try {
      const timestamp = Date.now();

      const documentData: any = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        isActive: true,
        createdBy: adminUid,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Add expiration date if provided
      if (notificationData.expiresAt) {
        documentData.expiresAt = notificationData.expiresAt.getTime();
      }

      // Create notification document
      const notificationRef = await addDoc(collection(FIREBASE_DB, 'notifications'), documentData);

      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get all notifications created by a specific admin
  async getNotificationsByAdmin(adminUid: string): Promise<NotificationData[]> {
    try {
      const notificationsQuery = query(
        collection(FIREBASE_DB, 'notifications'),
        where('createdBy', '==', adminUid)
        // Removed orderBy to avoid index requirement - we'll sort in JavaScript
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications: NotificationData[] = [];

      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          isActive: data.isActive,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          expiresAt: data.expiresAt,
        });
      });

      // Sort by createdAt in descending order (newest first)
      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting notifications by admin:', error);
      throw error;
    }
  },

  // Get active notifications for customers
  async getActiveNotificationsForCustomers(): Promise<NotificationData[]> {
    try {
      const currentTime = Date.now();
      
      const notificationsQuery = query(
        collection(FIREBASE_DB, 'notifications'),
        where('isActive', '==', true)
        // Removed orderBy to avoid index requirement - we'll sort in JavaScript
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications: NotificationData[] = [];

      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if notification has expired
        if (data.expiresAt && data.expiresAt < currentTime) {
          return; // Skip expired notifications
        }

        notifications.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          isActive: data.isActive,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          expiresAt: data.expiresAt,
        });
      });

      // Sort by createdAt in descending order (newest first)
      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting active notifications for customers:', error);
      throw error;
    }
  },

  // Update a notification
  async updateNotification(notificationId: string, updateData: UpdateNotificationData): Promise<void> {
    try {
      const notificationRef = doc(FIREBASE_DB, 'notifications', notificationId);
      
      const updateFields: any = {
        updatedAt: Date.now(),
      };

      // Add fields that are provided
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.message !== undefined) updateFields.message = updateData.message;
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.priority !== undefined) updateFields.priority = updateData.priority;
      if (updateData.expiresAt !== undefined) updateFields.expiresAt = updateData.expiresAt.getTime();

      await updateDoc(notificationRef, updateFields);
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(FIREBASE_DB, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Get notification by ID
  async getNotificationById(notificationId: string): Promise<NotificationData | null> {
    try {
      const notificationRef = doc(FIREBASE_DB, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (notificationDoc.exists()) {
        const data = notificationDoc.data();
        return {
          id: notificationDoc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          isActive: data.isActive,
          targetAudience: data.targetAudience,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          expiresAt: data.expiresAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  },


};
