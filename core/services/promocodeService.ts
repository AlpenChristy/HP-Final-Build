// File: core/services/promocodeService.ts
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';

// Promocode data interface
export interface PromocodeData {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  description?: string;
  showOnHome?: boolean; // Whether to display this promocode on home page
  createdBy: string; // Admin UID who created this promocode
  createdAt: number;
  updatedAt: number;
}

// Create promocode data interface (without id and timestamps)
export interface CreatePromocodeData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  description?: string;
  showOnHome?: boolean; // Whether to display this promocode on home page
}

// Update promocode data interface
export interface UpdatePromocodeData {
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  description?: string;
  showOnHome?: boolean; // Whether to display this promocode on home page
}

export const promocodeService = {
  // Create a new promocode
  async createPromocode(adminUid: string, promocodeData: CreatePromocodeData): Promise<string> {
    try {
      const timestamp = Date.now();

      // Check if promocode with same code already exists
      const existingPromocode = await this.getPromocodeByCode(promocodeData.code);
      if (existingPromocode) {
        throw new Error('Promocode with this code already exists');
      }

      // Prepare the document data, filtering out undefined values
      const documentData: any = {
        code: promocodeData.code,
        discountType: promocodeData.discountType,
        discountValue: promocodeData.discountValue,
        usageLimit: promocodeData.usageLimit,
        usedCount: 0,
        createdBy: adminUid,
        createdAt: timestamp,
        updatedAt: timestamp,
        validFrom: Timestamp.fromDate(promocodeData.validFrom),
        validUntil: Timestamp.fromDate(promocodeData.validUntil),
        isActive: promocodeData.isActive,
      };

      // Only add optional fields if they have values
      if (promocodeData.minOrderAmount !== undefined && promocodeData.minOrderAmount !== null) {
        documentData.minOrderAmount = promocodeData.minOrderAmount;
      }
      if (promocodeData.maxDiscount !== undefined && promocodeData.maxDiscount !== null) {
        documentData.maxDiscount = promocodeData.maxDiscount;
      }
      if (promocodeData.description !== undefined && promocodeData.description !== null && promocodeData.description.trim() !== '') {
        documentData.description = promocodeData.description;
      }
      if (promocodeData.showOnHome !== undefined) {
        documentData.showOnHome = promocodeData.showOnHome;
      }

      // Create promocode document
      const promocodeRef = await addDoc(collection(FIREBASE_DB, 'promocodes'), documentData);

      return promocodeRef.id;
    } catch (error) {
      console.error('Error creating promocode:', error);
      throw error;
    }
  },

  // Get all promocodes created by a specific admin
  async getPromocodesByAdmin(adminUid: string): Promise<PromocodeData[]> {
    try {
      
      // First try a simple query without orderBy to see if that's the issue
      const q = query(
        collection(FIREBASE_DB, 'promocodes'),
        where('createdBy', '==', adminUid)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Also check all promocodes in the database
      const allPromocodesQuery = query(collection(FIREBASE_DB, 'promocodes'));
      const allPromocodesSnapshot = await getDocs(allPromocodesQuery);
      allPromocodesSnapshot.forEach((doc) => {
        const data = doc.data();
      });
      
      const promocodes: PromocodeData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Validate that the document has required fields
        if (!data.code || !data.discountType || !data.discountValue) {
          console.warn('Skipping invalid promocode document:', doc.id, data);
          return;
        }
        
        promocodes.push({
          id: doc.id,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
          usedCount: data.usedCount || 0,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
          isActive: data.isActive,
          description: data.description,
          showOnHome: data.showOnHome,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

      return promocodes;
    } catch (error) {
      console.error('Error getting promocodes by admin:', error);
      throw error;
    }
  },

  // Get promocode by ID
  async getPromocodeById(id: string): Promise<PromocodeData | null> {
    try {
      const docRef = doc(FIREBASE_DB, 'promocodes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
          usedCount: data.usedCount || 0,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
          isActive: data.isActive,
          description: data.description,
          showOnHome: data.showOnHome,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting promocode by ID:', error);
      throw error;
    }
  },

  // Get promocode by code
  async getPromocodeByCode(code: string): Promise<PromocodeData | null> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'promocodes'),
        where('code', '==', code.toUpperCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
          usedCount: data.usedCount || 0,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
          isActive: data.isActive,
          description: data.description,
          showOnHome: data.showOnHome,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting promocode by code:', error);
      throw error;
    }
  },

  // Update promocode
  async updatePromocode(id: string, updateData: UpdatePromocodeData): Promise<void> {
    try {
      
      const timestamp = Date.now();
      const docRef = doc(FIREBASE_DB, 'promocodes', id);

      // Check if the document exists before trying to update
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error(`Promocode with ID ${id} does not exist`);
      }

      // If code is being updated, check if it already exists
      if (updateData.code) {
        const existingPromocode = await this.getPromocodeByCode(updateData.code);
        if (existingPromocode && existingPromocode.id !== id) {
          throw new Error('Promocode with this code already exists');
        }
      }

      // Prepare update data, filtering out undefined values
      const updatePayload: any = {
        updatedAt: timestamp,
      };

      // Only add fields that are defined
      if (updateData.code !== undefined) {
        updatePayload.code = updateData.code;
      }
      if (updateData.discountType !== undefined) {
        updatePayload.discountType = updateData.discountType;
      }
      if (updateData.discountValue !== undefined) {
        updatePayload.discountValue = updateData.discountValue;
      }
      if (updateData.usageLimit !== undefined) {
        updatePayload.usageLimit = updateData.usageLimit;
      }
      if (updateData.isActive !== undefined) {
        updatePayload.isActive = updateData.isActive;
      }
      if (updateData.minOrderAmount !== undefined && updateData.minOrderAmount !== null) {
        updatePayload.minOrderAmount = updateData.minOrderAmount;
      }
      if (updateData.maxDiscount !== undefined && updateData.maxDiscount !== null) {
        updatePayload.maxDiscount = updateData.maxDiscount;
      }
      if (updateData.description !== undefined && updateData.description !== null && updateData.description.trim() !== '') {
        updatePayload.description = updateData.description;
      }
      if (updateData.showOnHome !== undefined) {
        updatePayload.showOnHome = updateData.showOnHome;
      }

      // Convert dates to Timestamps if they exist
      if (updateData.validFrom) {
        updatePayload.validFrom = Timestamp.fromDate(updateData.validFrom);
      }
      if (updateData.validUntil) {
        updatePayload.validUntil = Timestamp.fromDate(updateData.validUntil);
      }

      await updateDoc(docRef, updatePayload);
    } catch (error) {
      console.error('Error updating promocode:', error);
      throw error;
    }
  },

  // Delete promocode
  async deletePromocode(id: string): Promise<void> {
    try {
      const docRef = doc(FIREBASE_DB, 'promocodes', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting promocode:', error);
      throw error;
    }
  },

  // Increment usage count
  async incrementUsageCount(id: string): Promise<void> {
    try {
      const docRef = doc(FIREBASE_DB, 'promocodes', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentUsedCount = docSnap.data().usedCount || 0;
        await updateDoc(docRef, {
          usedCount: currentUsedCount + 1,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  },

  // Validate promocode for use
  async validatePromocode(code: string, orderAmount: number): Promise<{ valid: boolean; promocode?: PromocodeData; error?: string }> {
    try {
      const promocode = await this.getPromocodeByCode(code);
      
      if (!promocode) {
        return { valid: false, error: 'Promocode not found' };
      }

      if (!promocode.isActive) {
        return { valid: false, error: 'Promocode is inactive' };
      }

      const now = new Date();
      if (now < promocode.validFrom || now > promocode.validUntil) {
        return { valid: false, error: 'Promocode is not valid at this time' };
      }

      if (promocode.usedCount >= promocode.usageLimit) {
        return { valid: false, error: 'Promocode usage limit exceeded' };
      }

      if (promocode.minOrderAmount && orderAmount < promocode.minOrderAmount) {
        return { valid: false, error: `Minimum order amount of ₹${promocode.minOrderAmount} required` };
      }

      return { valid: true, promocode };
    } catch (error) {
      console.error('Error validating promocode:', error);
      return { valid: false, error: 'Error validating promocode' };
    }
  },

  // Get all active promocodes (for customer use)
  async getActivePromocodes(): Promise<PromocodeData[]> {
    try {
      const now = new Date();
      
      // Use a simpler query to avoid composite index requirements
      // We'll filter the results in JavaScript instead
      const q = query(
        collection(FIREBASE_DB, 'promocodes'),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const promocodes: PromocodeData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const validFrom = data.validFrom?.toDate() || new Date();
        const validUntil = data.validUntil?.toDate() || new Date();
        
        // Filter promocodes that are currently valid (both start and end dates)
        if (now >= validFrom && now <= validUntil) {
          promocodes.push({
            id: doc.id,
            code: data.code,
            discountType: data.discountType,
            discountValue: data.discountValue,
            minOrderAmount: data.minOrderAmount,
            maxDiscount: data.maxDiscount,
            usageLimit: data.usageLimit,
            usedCount: data.usedCount || 0,
            validFrom: validFrom,
            validUntil: validUntil,
            isActive: data.isActive,
            description: data.description,
            showOnHome: data.showOnHome,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      });

      return promocodes;
    } catch (error) {
      console.error('Error getting active promocodes:', error);
      throw error;
    }
  },

  // Get featured promocodes for home page banner (prioritizes high-value, low-usage promocodes)
  async getFeaturedPromocodes(limit: number = 3): Promise<PromocodeData[]> {
    try {
      const activePromocodes = await this.getActivePromocodes();
      
      // Filter promocodes that are marked for home display
      const homePromocodes = activePromocodes.filter(promocode => promocode.showOnHome === true);
      
      // Sort promocodes by priority:
      // 1. Higher discount value first
      // 2. Lower usage percentage (more availability)
      // 3. Newer promocodes first
      const sortedPromocodes = homePromocodes.sort((a, b) => {
        // Calculate usage percentage
        const aUsagePercent = (a.usedCount / a.usageLimit) * 100;
        const bUsagePercent = (b.usedCount / b.usageLimit) * 100;
        
        // Normalize discount value (percentage vs fixed amount)
        const aValue = a.discountType === 'percentage' ? a.discountValue * 2 : a.discountValue; // Weight percentage higher
        const bValue = b.discountType === 'percentage' ? b.discountValue * 2 : b.discountValue;
        
        // Priority score (higher is better)
        const aScore = aValue - aUsagePercent + (a.createdAt / 1000000); // Include recency
        const bScore = bValue - bUsagePercent + (b.createdAt / 1000000);
        
        return bScore - aScore;
      });
      
      return sortedPromocodes.slice(0, limit);
    } catch (error) {
      console.error('Error getting featured promocodes:', error);
      throw error;
    }
  },
};
