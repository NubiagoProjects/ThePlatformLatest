'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cartStorage } from '@/lib/storage';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  inStock: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getCartSubtotal: () => number;
  getShippingCost: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  isCartEmpty: boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = cartStorage.get<CartItem[]>('items', []);
        if (savedCart && Array.isArray(savedCart)) {
          setItems(savedCart);
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        setItems([]);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCart();
  }, []);

  // Save cart to storage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        cartStorage.set('items', items);
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    }
  }, [items, isLoaded]);

  const addToCart = (product: Omit<CartItem, 'id'>) => {
    setItems((prevItems: CartItem[]) => {
      const existingItem = prevItems.find(item => item.productId === product.productId);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((item: CartItem) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          ...product,
          id: `${product.productId}-${Date.now()}`,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems: CartItem[]) => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems((prevItems: CartItem[]) =>
      prevItems.map((item: CartItem) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getCartSubtotal = () => {
    return items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    return items.reduce((total: number, item: CartItem) => {
      if (item.originalPrice) {
        return total + ((item.originalPrice - item.price) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getShippingCost = () => {
    const subtotal = getCartSubtotal();
    return subtotal >= 50 ? 0 : 5.99; // Free shipping over $50
  };

  const getTaxAmount = () => {
    const subtotal = getCartSubtotal();
    return subtotal * 0.08; // 8% tax rate
  };

  const getCartTotal = () => {
    return getCartSubtotal() + getShippingCost() + getTaxAmount();
  };

  const getCartCount = () => {
    return items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartSubtotal,
    getShippingCost,
    getTaxAmount,
    getDiscountAmount,
    isCartEmpty: items.length === 0,
    isLoading: !isLoaded,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 