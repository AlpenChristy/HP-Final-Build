// d:\NEW-HP-APP\core\context\CartContext.tsx
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH, FIREBASE_DB } from '../firebase/firebase';
import { Product } from '../services/productService';

// Define the cart item interface
export interface CartItem {
  id?: string;
  productId: string;
  userId: string;
  product: Product;
  quantity: number;
  createdAt?: any;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = FIREBASE_AUTH;

  // Fetch cart items when the component mounts or user changes
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!auth.currentUser) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = auth.currentUser.uid;
        const cartCollection = collection(FIREBASE_DB, 'carts');
        const q = query(cartCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CartItem[];
        
        setCartItems(items);
      } catch (error) {
        console.error('Error fetching cart items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
    
    // Set up an auth state listener
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchCartItems();
    });

    return () => unsubscribe();
  }, [auth]);

  // Add a product to the cart
  const addToCart = async (product: Product, quantity: number) => {
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      
      // Check if the product is already in the cart
      const existingItem = cartItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update the quantity if the product is already in the cart
        await updateQuantity(existingItem.id!, existingItem.quantity + quantity);
      } else {
        // Add a new item to the cart
        const cartCollection = collection(FIREBASE_DB, 'carts');
        const newCartItem: Omit<CartItem, 'id'> = {
          productId: product.id!,
          userId,
          product,
          quantity,
          createdAt: new Date()
        };
        
        const docRef = await addDoc(cartCollection, newCartItem);
        
        setCartItems(prev => [...prev, { id: docRef.id, ...newCartItem }]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  // Update the quantity of a cart item
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      
      const cartItemRef = doc(FIREBASE_DB, 'carts', itemId);
      await updateDoc(cartItemRef, { quantity });
      
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  // Remove an item from the cart
  const removeFromCart = async (itemId: string) => {
    try {
      const cartItemRef = doc(FIREBASE_DB, 'carts', itemId);
      await deleteDoc(cartItemRef);
      
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  // Clear the entire cart
  const clearCart = async () => {
    try {
      // Delete all cart items for the current user
      const deletePromises = cartItems.map(item => 
        removeFromCart(item.id!)
      );
      
      await Promise.all(deletePromises);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  // Calculate the total price of items in the cart
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
