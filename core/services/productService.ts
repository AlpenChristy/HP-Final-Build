// core/services/productService.ts

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { FIREBASE_DB } from '../firebase/firebase';

// Define the Product interface based on your requirements
export interface Product {
  id?: string;
  name: string;
  type: string;
  weight?: number; // Made optional since we're not using it in the admin form
  price: number;
  originalPrice?: number;
  inStock: boolean;
  quantity?: number; // Admin-only field for stock quantity
  image: string;
  description: string;
  createdAt: any;
}

// Reference to the products collection
const productsCollection = collection(FIREBASE_DB, 'products');

// Add a new product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>, imageFile?: File) => {
  try {
    // If there's an image file, upload it to Firebase Storage
    let imageUrl = productData.image;
    
    if (imageFile) {
      const storage = getStorage();
      const storageRef = ref(storage, `product-images/${Date.now()}-${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Add the product to Firestore with server timestamp
    const docRef = await addDoc(productsCollection, {
      ...productData,
      image: imageUrl,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...productData, image: imageUrl };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Get all products
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(productsCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get products by type
export const getProductsByType = async (type: string) => {
  try {
    const q = query(productsCollection, where("type", "==", type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products by type:', error);
    throw error;
  }
};

// Get products for customers (show all products, regardless of stock)
export const getCustomerProducts = async () => {
  try {
    const querySnapshot = await getDocs(productsCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting customer products:', error);
    throw error;
  }
};

// Get products by type for customers (show all products of that type)
export const getCustomerProductsByType = async (type: string) => {
  try {
    const q = query(
      productsCollection, 
      where("type", "==", type)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting customer products by type:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productRef = doc(FIREBASE_DB, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      return {
        id: productDoc.id,
        ...productDoc.data()
      } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    return null;
  }
};

// Update a product
export const updateProduct = async (id: string, productData: Partial<Product>) => {
  try {
    const productRef = doc(FIREBASE_DB, 'products', id);
    await updateDoc(productRef, productData);
    return { id, ...productData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id: string) => {
  try {
    const productRef = doc(FIREBASE_DB, 'products', id);
    await deleteDoc(productRef);
    return id;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
