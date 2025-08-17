// File: core/services/orderService.ts
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { CartItem } from '../context/CartContext';
import { FIREBASE_DB } from '../firebase/firebase';
import { getProductById, updateProduct } from './productService';
import { PromocodeData } from './promocodeService';

// Order data interface
export interface OrderData {
  id?: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  gst: number;
  discount: number;
  total: number;
  appliedPromocode?: PromocodeData | null;
  paymentMethod: 'cod';
  orderStatus: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAgentId?: string;
  deliveryAgentName?: string;
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
  deliveryAddress: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  gst: number;
  discount: number;
  total: number;
  appliedPromocode?: PromocodeData | null;
  paymentMethod: 'cod';
}

export const orderService = {
  // Create a new order
  async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      const timestamp = Date.now();
      
      const orderDocument = {
        ...orderData,
        orderStatus: 'pending' as const,
        orderDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const orderRef = await addDoc(collection(FIREBASE_DB, 'orders'), orderDocument);
      
      // Update stock levels for all products in the order (can go negative for backorders)
      await this.updateStockLevels(orderData.items);
      
      console.log('Order created successfully with ID:', orderRef.id);
      return orderRef.id;
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
          
          console.log(`Updated stock for ${product.name}: ${currentQuantity} -> ${newQuantity}`);
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

  // Get order by ID
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

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderData['orderStatus']): Promise<void> {
    try {
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      
      // Get the current order to check if we need to restore stock
      const currentOrder = await this.getOrderById(orderId);
      
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
          
          console.log(`Restored stock for ${product.name}: ${currentQuantity} -> ${newQuantity}`);
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

  // Delete order
  async deleteOrder(orderId: string): Promise<void> {
    try {
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      await deleteDoc(orderRef);
      console.log('Order deleted successfully:', orderId);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
};
