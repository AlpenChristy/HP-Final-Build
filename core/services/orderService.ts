// File: core/services/orderService.ts
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { CartItem } from '../context/CartContext';
import { FIREBASE_DB } from '../firebase/firebase';
import { getProductById, updateProduct } from './productService';
import { PromocodeData } from './promocodeService';

// Order data interface
export interface OrderData {
  id?: string;
  orderId?: string; // Custom structured order ID
  userId: string;
  customerName: string;
  customerPhone: string;
  consumerNumber?: string;
  deliveryAddress: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedPromocode?: PromocodeData | null;
  paymentMethod: 'cod';
  orderStatus: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  deliveryNotes?: string;
  orderDate: number;
  expectedDelivery?: number;
  deliveredAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Create order data interface (without id and timestamps)
export interface CreateOrderData {
  userId: string;
  customerName: string;
  customerPhone: string;
  consumerNumber?: string;
  deliveryAddress: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedPromocode?: PromocodeData | null;
  paymentMethod: 'cod';
}

export const orderService = {
  // Helper function to clean order data for Firebase
  cleanOrderData(orderData: CreateOrderData): any {
    const cleanedData = { ...orderData };
    
    // Clean appliedPromocode if it exists
    if (cleanedData.appliedPromocode) {
      const cleanedPromocode: any = {};
      
      // Only include defined values
      if (cleanedData.appliedPromocode.code !== undefined) cleanedPromocode.code = cleanedData.appliedPromocode.code;
      if (cleanedData.appliedPromocode.discountType !== undefined) cleanedPromocode.discountType = cleanedData.appliedPromocode.discountType;
      if (cleanedData.appliedPromocode.discountValue !== undefined) cleanedPromocode.discountValue = cleanedData.appliedPromocode.discountValue;
      if (cleanedData.appliedPromocode.usageLimit !== undefined) cleanedPromocode.usageLimit = cleanedData.appliedPromocode.usageLimit;
      if (cleanedData.appliedPromocode.usedCount !== undefined) cleanedPromocode.usedCount = cleanedData.appliedPromocode.usedCount;
      if (cleanedData.appliedPromocode.validFrom !== undefined) cleanedPromocode.validFrom = cleanedData.appliedPromocode.validFrom;
      if (cleanedData.appliedPromocode.validUntil !== undefined) cleanedPromocode.validUntil = cleanedData.appliedPromocode.validUntil;
      if (cleanedData.appliedPromocode.isActive !== undefined) cleanedPromocode.isActive = cleanedData.appliedPromocode.isActive;
      if (cleanedData.appliedPromocode.description !== undefined) cleanedPromocode.description = cleanedData.appliedPromocode.description;
      if (cleanedData.appliedPromocode.showOnHome !== undefined) cleanedPromocode.showOnHome = cleanedData.appliedPromocode.showOnHome;
      if (cleanedData.appliedPromocode.minOrderAmount !== undefined) cleanedPromocode.minOrderAmount = cleanedData.appliedPromocode.minOrderAmount;
      if (cleanedData.appliedPromocode.maxDiscount !== undefined) cleanedPromocode.maxDiscount = cleanedData.appliedPromocode.maxDiscount;
      
      cleanedData.appliedPromocode = cleanedPromocode;
    }
    
    // Clean product data in cart items to remove undefined values
    if (cleanedData.items && Array.isArray(cleanedData.items)) {
      cleanedData.items = cleanedData.items.map(item => {
        const cleanedItem = { ...item };
        
        // Clean the product object within each cart item
        if (cleanedItem.product) {
          const cleanedProduct: any = {};
          
          // Only include defined values for product fields
          if (cleanedItem.product.id !== undefined) cleanedProduct.id = cleanedItem.product.id;
          if (cleanedItem.product.name !== undefined) cleanedProduct.name = cleanedItem.product.name;
          if (cleanedItem.product.type !== undefined) cleanedProduct.type = cleanedItem.product.type;
          if (cleanedItem.product.weight !== undefined) cleanedProduct.weight = cleanedItem.product.weight;
          if (cleanedItem.product.price !== undefined) cleanedProduct.price = cleanedItem.product.price;
          if (cleanedItem.product.originalPrice !== undefined) cleanedProduct.originalPrice = cleanedItem.product.originalPrice;
          if (cleanedItem.product.inStock !== undefined) cleanedProduct.inStock = cleanedItem.product.inStock;
          if (cleanedItem.product.quantity !== undefined) cleanedProduct.quantity = cleanedItem.product.quantity;
          if (cleanedItem.product.image !== undefined) cleanedProduct.image = cleanedItem.product.image;
          if (cleanedItem.product.description !== undefined) cleanedProduct.description = cleanedItem.product.description;
          if (cleanedItem.product.createdAt !== undefined) cleanedProduct.createdAt = cleanedItem.product.createdAt;
          
          cleanedItem.product = cleanedProduct;
        }
        
        return cleanedItem;
      });
    }
    
    return cleanedData;
  },

  // Generate structured order ID
  generateOrderId(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ORD${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  },

  // Create a new order
  async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      const timestamp = Date.now();
      const orderId = this.generateOrderId();
      
      // Clean the order data to remove undefined values
      const cleanedOrderData = this.cleanOrderData(orderData);
      
      const orderDocument = {
        ...cleanedOrderData,
        orderId: orderId, // Add custom order ID
        orderStatus: 'pending' as const,
        orderDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const orderRef = await addDoc(collection(FIREBASE_DB, 'orders'), orderDocument);
      
      // Update stock levels for all products in the order (can go negative for backorders)
      await this.updateStockLevels(orderData.items);
      
      return orderId; // Return custom order ID instead of Firebase ID
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update stock levels when order is placed (allows backorders)
  async updateStockLevels(items: CartItem[]): Promise<void> {
    try {
      for (const item of items) {
        const product = await getProductById(item.productId);
        if (product) {
          const currentQuantity = product.quantity || 0;
          const newQuantity = currentQuantity - item.quantity; // Can go negative for backorders
          
          // Update the product with new stock level
          await updateProduct(product.id!, {
            ...product,
            quantity: newQuantity,
            // Keep inStock as true even when quantity is negative - don't hide from customers
            inStock: true
          });
          
        }
      }
    } catch (error) {
      console.error('Error updating stock levels:', error);
      throw error;
    }
  },

  // Get orders by user ID
  async getOrdersByUser(userId: string): Promise<OrderData[]> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'orders'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const orders: OrderData[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as OrderData);
      });

      // Sort in memory instead of in the query
      return orders.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting orders by user:', error);
      throw error;
    }
  },

  // Get order by ID (Firebase document ID)
  async getOrderById(orderId: string): Promise<OrderData | null> {
    try {
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        return {
          id: orderDoc.id,
          ...orderDoc.data()
        } as OrderData;
      }
      return null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  },

  // Get order by custom order ID
  async getOrderByCustomId(customOrderId: string): Promise<OrderData | null> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'orders'),
        where('orderId', '==', customOrderId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as OrderData;
      }
      return null;
    } catch (error) {
      console.error('Error getting order by custom ID:', error);
      return null;
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderData['orderStatus']): Promise<void> {
    try {
      // Try to get order by custom ID first, then fallback to Firebase ID
      let currentOrder = await this.getOrderByCustomId(orderId);
      let orderRef;
      
      if (currentOrder) {
        orderRef = doc(FIREBASE_DB, 'orders', currentOrder.id!);
      } else {
        // Fallback to Firebase document ID for backward compatibility
        currentOrder = await this.getOrderById(orderId);
        if (currentOrder) {
          orderRef = doc(FIREBASE_DB, 'orders', orderId);
        } else {
          throw new Error('Order not found');
        }
      }
      
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: Date.now(),
      });

      // If order is being cancelled, restore stock
      if (currentOrder && status === 'cancelled' && currentOrder.orderStatus !== 'cancelled') {
        await this.restoreStockLevels(currentOrder.items);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Update order status with delivery notes
  async updateOrderStatusWithNotes(orderId: string, status: OrderData['orderStatus'], notes?: string): Promise<void> {
    try {
      // Try to get order by custom ID first, then fallback to Firebase ID
      let currentOrder = await this.getOrderByCustomId(orderId);
      let orderRef;
      
      if (currentOrder) {
        orderRef = doc(FIREBASE_DB, 'orders', currentOrder.id!);
      } else {
        // Fallback to Firebase document ID for backward compatibility
        currentOrder = await this.getOrderById(orderId);
        if (currentOrder) {
          orderRef = doc(FIREBASE_DB, 'orders', orderId);
        } else {
          throw new Error('Order not found');
        }
      }
      
      const updateData: any = {
        orderStatus: status,
        updatedAt: Date.now(),
      };

      // Add notes if provided
      if (notes) {
        updateData.deliveryNotes = notes;
      }

      // Add deliveredAt timestamp if marking as delivered
      if (status === 'delivered') {
        updateData.deliveredAt = Date.now();
      }

      await updateDoc(orderRef, updateData);

      // If order is being cancelled, restore stock
      if (currentOrder && status === 'cancelled' && currentOrder.orderStatus !== 'cancelled') {
        await this.restoreStockLevels(currentOrder.items);
      }
    } catch (error) {
      console.error('Error updating order status with notes:', error);
      throw error;
    }
  },

  // Restore stock levels when order is cancelled
  async restoreStockLevels(items: CartItem[]): Promise<void> {
    try {
      for (const item of items) {
        const product = await getProductById(item.productId);
        if (product) {
          const currentQuantity = product.quantity || 0;
          const newQuantity = currentQuantity + item.quantity;
          
          // Update the product with restored stock level
          await updateProduct(product.id!, {
            ...product,
            quantity: newQuantity,
            inStock: true // Make sure it's visible to customers again
          });
          
        }
      }
    } catch (error) {
      console.error('Error restoring stock levels:', error);
      throw error;
    }
  },

  // Check if order can be placed (stock availability)
  async checkStockAvailability(items: CartItem[]): Promise<{ available: boolean; unavailableItems: string[] }> {
    try {
      const unavailableItems: string[] = [];
      
      for (const item of items) {
        const product = await getProductById(item.productId);
        if (!product) {
          unavailableItems.push(`Product not found: ${item.product.name}`);
          continue;
        }
        
        // Don't check inStock status - let customers see all products
        // Only check if quantity is sufficient
        
        const currentQuantity = product.quantity || 0;
        if (currentQuantity < item.quantity) {
          unavailableItems.push(`${product.name} - only ${currentQuantity} available, requested ${item.quantity}`);
        }
      }
      
      return {
        available: unavailableItems.length === 0,
        unavailableItems
      };
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  },

  // Assign delivery agent to order
  async assignDeliveryAgent(orderId: string, agentId: string, agentName: string): Promise<void> {
    try {
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      await updateDoc(orderRef, {
        deliveryAgentId: agentId,
        deliveryAgentName: agentName,
        orderStatus: 'confirmed' as const,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error assigning delivery agent:', error);
      throw error;
    }
  },

  // Mark order as delivered
  async markOrderAsDelivered(orderId: string): Promise<void> {
    try {
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: 'delivered' as const,
        deliveredAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      throw error;
    }
  },

  // Get all orders (for admin)
  async getAllOrders(): Promise<OrderData[]> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'orders'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: OrderData[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as OrderData);
      });

      return orders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  },

  // Subscribe to all orders in real-time (for admin)
  subscribeAllOrders(onChange: (orders: OrderData[]) => void): () => void {
    const q = query(
      collection(FIREBASE_DB, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: OrderData[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as OrderData[];
      onChange(orders);
    });
    return unsubscribe;
  },

  // Get orders by status
  async getOrdersByStatus(status: OrderData['orderStatus']): Promise<OrderData[]> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'orders'),
        where('orderStatus', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: OrderData[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as OrderData);
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw error;
    }
  },

  // Get orders by delivery agent ID
  async getOrdersByDeliveryAgent(agentId: string): Promise<OrderData[]> {
    try {
      const q = query(
        collection(FIREBASE_DB, 'orders'),
        where('deliveryAgentId', '==', agentId)
      );
      
      const querySnapshot = await getDocs(q);
      const orders: OrderData[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as OrderData);
      });

      // Sort in memory instead of in the query
      return orders.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting orders by delivery agent:', error);
      throw error;
    }
  },

  // Subscribe to orders by user in real-time (for customer views)
  subscribeOrdersByUser(userId: string, onChange: (orders: OrderData[]) => void): () => void {
    const q = query(
      collection(FIREBASE_DB, 'orders'),
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: OrderData[] = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) })) as OrderData[];
      // Sort in memory to keep newest first
      onChange(orders.sort((a, b) => b.createdAt - a.createdAt));
    });
    return unsubscribe;
  },

  // Delete order
  async deleteOrder(orderId: string): Promise<void> {
    try {
      // Try to get order by custom ID first, then fallback to Firebase ID
      let currentOrder = await this.getOrderByCustomId(orderId);
      let orderRef;
      
      if (currentOrder) {
        orderRef = doc(FIREBASE_DB, 'orders', currentOrder.id!);
      } else {
        // Fallback to Firebase document ID for backward compatibility
        orderRef = doc(FIREBASE_DB, 'orders', orderId);
      }
      
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Delete delivery notes from order
  async deleteDeliveryNotes(orderId: string): Promise<void> {
    try {
      // Try to get order by custom ID first, then fallback to Firebase ID
      let currentOrder = await this.getOrderByCustomId(orderId);
      let orderRef;
      
      if (currentOrder) {
        orderRef = doc(FIREBASE_DB, 'orders', currentOrder.id!);
      } else {
        // Fallback to Firebase document ID for backward compatibility
        currentOrder = await this.getOrderById(orderId);
        if (currentOrder) {
          orderRef = doc(FIREBASE_DB, 'orders', orderId);
        } else {
          throw new Error('Order not found');
        }
      }
      
      await updateDoc(orderRef, {
        deliveryNotes: null,
        updatedAt: Date.now(),
      });
      
    } catch (error) {
      console.error('Error deleting delivery notes:', error);
      throw error;
    }
  }
};
