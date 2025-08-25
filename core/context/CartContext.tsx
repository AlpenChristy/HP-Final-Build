// d:\NEW-HP-APP\core\context\CartContext.tsx
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FIREBASE_DB } from '../firebase/firebase';
import { Product } from '../services/productService';
import { PromocodeData } from '../services/promocodeService';
import { useAuth } from '../auth/AuthContext';
import { createToastHelpers } from '../utils/toastUtils';

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
  // Promocode functionality
  appliedPromocode: PromocodeData | null;
  discount: number;
  setAppliedPromocode: (promocode: PromocodeData | null) => void;
  setDiscount: (amount: number) => void;
  clearPromocode: () => void;
  recalculatePromocodeDiscount: () => { valid: boolean; discount?: number; error?: string };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPromocode, setAppliedPromocode] = useState<PromocodeData | null>(null);
  const [discount, setDiscount] = useState(0);
  const { userSession, isAuthenticated } = useAuth();
  const toast = createToastHelpers();


  // Fetch cart items when the component mounts or user changes
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!isAuthenticated || !userSession) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = userSession.uid;
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
  }, [isAuthenticated, userSession]);

  // Add a product to the cart
  const addToCart = async (product: Product, quantity: number) => {
    if (!isAuthenticated || !userSession) {
      console.error('User not authenticated');
      toast.showAuthenticationError('Please log in to add items to cart');
      return;
    }

    try {
      const userId = userSession.uid;
      
      // Check if the product is already in the cart
      const existingItem = cartItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update the quantity if the product is already in the cart
        await updateQuantity(existingItem.id!, existingItem.quantity + quantity);
        toast.showSuccess('Cart Updated', `${product.name} quantity updated in your cart`);
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
        toast.showSuccess('Added to Cart', `${product.name} has been added to your cart`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.showError('Add to Cart Failed', 'Failed to add item to cart. Please try again.');
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

  // Clear promocode
  const clearPromocode = () => {
    setAppliedPromocode(null);
    setDiscount(0);
  };

  // Recalculate promocode discount based on current cart total
  const recalculatePromocodeDiscount = () => {
    if (appliedPromocode) {
      const subtotal = getCartTotal();
      
      // Check if promocode is still valid with current cart total
      if (appliedPromocode.minOrderAmount && subtotal < appliedPromocode.minOrderAmount) {
        // Cart total is below minimum order amount, remove promocode
        clearPromocode();
        return { valid: false, error: `Minimum order amount of ₹${appliedPromocode.minOrderAmount} required` };
      }
      
      // Recalculate discount based on current cart total
      let calculatedDiscount = 0;
      if (appliedPromocode.discountType === 'percentage') {
        calculatedDiscount = (subtotal * appliedPromocode.discountValue) / 100;
        // Apply maximum discount if set
        if (appliedPromocode.maxDiscount && calculatedDiscount > appliedPromocode.maxDiscount) {
          calculatedDiscount = appliedPromocode.maxDiscount;
        }
      } else {
        calculatedDiscount = appliedPromocode.discountValue;
      }
      
      setDiscount(calculatedDiscount);
      return { valid: true, discount: calculatedDiscount };
    }
    return { valid: false, error: 'No promocode applied' };
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
        getCartTotal,
        // Promocode functionality
        appliedPromocode,
        discount,
        setAppliedPromocode,
        setDiscount,
        clearPromocode,
        recalculatePromocodeDiscount
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
    console.error('CartContext is undefined. Make sure CartProvider is wrapping the component.');
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
