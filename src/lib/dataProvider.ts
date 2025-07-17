import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'SUPPLIER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  createdAt: Date;
  updatedAt: Date;
}

// Data Provider Functions
export async function getProducts(filters?: { category?: string; isActive?: boolean }) {
  let q: any = collection(firestore, 'products');
  
  if (filters?.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters?.isActive !== undefined) {
    q = query(q, where('isActive', '==', filters.isActive));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function getProduct(id: string) {
  const docRef = doc(firestore, 'products', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Product not found');
  }
  
  return { id: docSnap.id, ...(docSnap.data() as any) };
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  
  const docRef = await addDoc(collection(firestore, 'products'), {
    ...product,
    createdAt: now,
    updatedAt: now
  });
  
  return { id: docRef.id, ...product, createdAt: now, updatedAt: now };
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const now = new Date();
  
  const docRef = doc(firestore, 'products', id);
  await updateDoc(docRef, { ...updates, updatedAt: now });
  
  const updatedDoc = await getDoc(docRef);
  return { id: updatedDoc.id, ...(updatedDoc.data() as any) };
}

export async function deleteProduct(id: string) {
  const docRef = doc(firestore, 'products', id);
  await deleteDoc(docRef);
}

export async function getUsers(filters?: { role?: string; isActive?: boolean }) {
  let q: any = collection(firestore, 'users');
  
  if (filters?.role) {
    q = query(q, where('role', '==', filters.role));
  }
  if (filters?.isActive !== undefined) {
    q = query(q, where('isActive', '==', filters.isActive));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function getOrders(userId?: string) {
  let q: any = collection(firestore, 'orders');
  
  if (userId) {
    q = query(q, where('userId', '==', userId));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  
  const docRef = await addDoc(collection(firestore, 'orders'), {
    ...order,
    createdAt: now,
    updatedAt: now
  });
  
  return { id: docRef.id, ...order, createdAt: now, updatedAt: now };
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  const now = new Date();
  
  const docRef = doc(firestore, 'orders', id);
  await updateDoc(docRef, { ...updates, updatedAt: now });
  
  const updatedDoc = await getDoc(docRef);
  return { id: updatedDoc.id, ...(updatedDoc.data() as any) };
}

// Authentication functions
export async function signUp(email: string, password: string, name: string) {
  // This will be handled by Firebase Auth directly
  // For now, return a mock response
  return {
    user: {
      id: 'mock-user-id',
      email,
      name,
      role: 'USER' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}

export async function signIn(email: string, password: string) {
  // This will be handled by Firebase Auth directly
  // For now, return a mock response
  return {
    user: {
      id: 'mock-user-id',
      email,
      name: 'Mock User',
      role: 'USER' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}

export async function signOut() {
  // This will be handled by Firebase Auth directly
  return Promise.resolve();
}

export function getCurrentProvider() {
  return 'firebase';
} 