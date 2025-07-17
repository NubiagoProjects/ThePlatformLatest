import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  runTransaction,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  trackQuantity: boolean;
  quantity: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  categoryId: string;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id?: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id?: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: Date;
}

export interface Address {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id?: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Generic CRUD operations
export class FirestoreService<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Create document
  async create(data: Omit<T, 'id'>): Promise<T & { id: string }> {
    const docRef = await addDoc(collection(db, this.collectionName), data);
    return { id: docRef.id, ...data } as T & { id: string };
  }

  // Get document by ID
  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  // Update document
  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as DocumentData);
  }

  // Delete document
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  // Get all documents
  async getAll(): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }

  // Query documents
  async query(
    conditions: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<T[]> {
    let q = collection(db, this.collectionName);

    // Add where conditions
    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    // Add order by
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }

  // Real-time listener
  onSnapshot(
    callback: (docs: T[]) => void,
    conditions: Array<{ field: string; operator: any; value: any }> = []
  ) {
    let q = collection(db, this.collectionName);

    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
      callback(docs);
    });
  }
}

// Specific services
export const productService = new FirestoreService<Product>('products');
export const categoryService = new FirestoreService<Category>('categories');
export const orderService = new FirestoreService<Order>('orders');
export const orderItemService = new FirestoreService<OrderItem>('orderItems');
export const addressService = new FirestoreService<Address>('addresses');
export const reviewService = new FirestoreService<Review>('reviews');

// Product-specific operations
export const productOperations = {
  // Get featured products
  async getFeaturedProducts(limitCount: number = 10): Promise<Product[]> {
    return productService.query(
      [{ field: 'isFeatured', operator: '==', value: true }],
      'createdAt',
      'desc',
      limitCount
    );
  },

  // Get products by category
  async getProductsByCategory(categoryId: string, limitCount: number = 20): Promise<Product[]> {
    return productService.query(
      [
        { field: 'categoryId', operator: '==', value: categoryId },
        { field: 'isActive', operator: '==', value: true }
      ],
      'createdAt',
      'desc',
      limitCount
    );
  },

  // Search products
  async searchProducts(searchTerm: string, limitCount: number = 20): Promise<Product[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia for production
    const allProducts = await productService.getAll();
    return allProducts
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, limitCount);
  },

  // Get products by supplier
  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    return productService.query([
      { field: 'supplierId', operator: '==', value: supplierId }
    ]);
  },

  // Update product quantity
  async updateProductQuantity(productId: string, quantity: number): Promise<void> {
    await productService.update(productId, { quantity, updatedAt: new Date() });
  },
};

// Order-specific operations
export const orderOperations = {
  // Get orders by user
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return orderService.query([
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt', 'desc');
  },

  // Get orders by status
  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    return orderService.query([
      { field: 'status', operator: '==', value: status }
    ], 'createdAt', 'desc');
  },

  // Create order with items (transaction)
  async createOrderWithItems(order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'orderId'>[]): Promise<Order> {
    return runTransaction(db, async (transaction) => {
      // Create order
      const orderRef = doc(collection(db, 'orders'));
      const orderData = { ...order, createdAt: new Date(), updatedAt: new Date() };
      transaction.set(orderRef, orderData);

      // Create order items
      const orderItems = items.map(item => ({
        ...item,
        orderId: orderRef.id,
        createdAt: new Date()
      }));

      orderItems.forEach(item => {
        const itemRef = doc(collection(db, 'orderItems'));
        transaction.set(itemRef, item);
      });

      return { id: orderRef.id, ...orderData } as Order;
    });
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const updates: Partial<Order> = { 
      status, 
      updatedAt: new Date() 
    };

    if (status === 'SHIPPED') {
      updates.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updates.deliveredAt = new Date();
    }

    await orderService.update(orderId, updates);
  },
};

// Category-specific operations
export const categoryOperations = {
  // Get categories with children
  async getCategoriesWithChildren(): Promise<Category[]> {
    const categories = await categoryService.getAll();
    return categories.filter(cat => !cat.parentId); // Only root categories
  },

  // Get subcategories
  async getSubcategories(parentId: string): Promise<Category[]> {
    return categoryService.query([
      { field: 'parentId', operator: '==', value: parentId },
      { field: 'isActive', operator: '==', value: true }
    ]);
  },
};

// Review-specific operations
export const reviewOperations = {
  // Get reviews by product
  async getReviewsByProduct(productId: string): Promise<Review[]> {
    return reviewService.query([
      { field: 'productId', operator: '==', value: productId },
      { field: 'isApproved', operator: '==', value: true }
    ], 'createdAt', 'desc');
  },

  // Get average rating for product
  async getProductAverageRating(productId: string): Promise<number> {
    const reviews = await reviewOperations.getReviewsByProduct(productId);
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  },
};

// Address-specific operations
export const addressOperations = {
  // Get addresses by user
  async getAddressesByUser(userId: string): Promise<Address[]> {
    return addressService.query([
      { field: 'userId', operator: '==', value: userId }
    ], 'isDefault', 'desc');
  },

  // Set default address
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const batch = writeBatch(db);

    // Remove default from all user addresses
    const userAddresses = await addressOperations.getAddressesByUser(userId);
    userAddresses.forEach(address => {
      if (address.isDefault) {
        const addressRef = doc(db, 'addresses', address.id!);
        batch.update(addressRef, { isDefault: false, updatedAt: new Date() });
      }
    });

    // Set new default address
    const addressRef = doc(db, 'addresses', addressId);
    batch.update(addressRef, { isDefault: true, updatedAt: new Date() });

    await batch.commit();
  },
}; 