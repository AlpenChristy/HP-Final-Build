// File: core/services/orderService.ts
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { CartItem } from '../context/CartContext';
import { FIREBASE_DB } from '../firebase/firebase';
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
      
      console.log('Order created successfully with ID:', orderRef.id);
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
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
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
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
  }
};
