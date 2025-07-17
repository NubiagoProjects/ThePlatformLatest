'use client';

import React from 'react';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseBadge } from '@/components/ui/BaseBadge';
import { Trash2, ShoppingBag, CreditCard, Truck } from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  inStock: boolean;
  maxQuantity?: number;
}

interface CartSummaryProps {
  items: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCheckout?: () => void;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  className = '',
}) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const inStockItems = items.filter(item => item.inStock);
  const outOfStockItems = items.filter(item => !item.inStock);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cart Items */}
      <BaseCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          <BaseBadge variant="secondary">{items.length} items</BaseBadge>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">Add some products to get started</p>
            <BaseButton variant="outline" onClick={() => window.history.back()}>
              Continue Shopping
            </BaseButton>
          </div>
        ) : (
          <div className="space-y-4">
            {/* In Stock Items */}
            {inStockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity?.(item.id, Number(e.target.value))}
                    className="border rounded-md px-2 py-1 text-sm"
                    max={item.maxQuantity || 99}
                  >
                    {Array.from({ length: Math.min(item.maxQuantity || 99, 10) }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onRemoveItem?.(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Out of Stock Items */}
            {outOfStockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md opacity-50"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-gray-600">${item.price.toFixed(2)}</p>
                  <BaseBadge variant="destructive" className="text-xs">Out of Stock</BaseBadge>
                </div>
                <button
                  onClick={() => onRemoveItem?.(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </BaseCard>

      {/* Order Summary */}
      {items.length > 0 && (
        <BaseCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal ({items.length} items)</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Truck className="w-4 h-4" />
              <span>
                {shipping === 0 
                  ? 'Free shipping on orders over $50'
                  : 'Add ${(50 - subtotal).toFixed(2)} more for free shipping'
                }
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="mt-6 space-y-3">
            <BaseButton
              onClick={onCheckout}
              disabled={inStockItems.length === 0}
              className="w-full"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </BaseButton>
            
            {outOfStockItems.length > 0 && (
              <p className="text-sm text-red-600 text-center">
                Remove out-of-stock items to continue
              </p>
            )}
          </div>
        </BaseCard>
      )}
    </div>
  );
}; 