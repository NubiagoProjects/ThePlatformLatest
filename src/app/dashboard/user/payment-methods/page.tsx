'use client'

import { useState } from 'react'
import { CreditCard, Plus, Trash2, Edit, Lock } from 'lucide-react'

interface PaymentMethod {
  id: string;
  type: 'credit-card' | 'paypal' | 'apple-pay';
  name: string;
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
  email?: string;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit-card',
      name: 'Visa ending in 4242',
      last4: '4242',
      expiryDate: '12/25',
      isDefault: true
    },
    {
      id: '2',
      type: 'credit-card',
      name: 'Mastercard ending in 8888',
      last4: '8888',
      expiryDate: '08/26',
      isDefault: false
    },
    {
      id: '3',
      type: 'paypal',
      name: 'PayPal',
      email: 'john.doe@example.com',
      isDefault: false
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'credit-card':
        return <CreditCard size={20} className="text-gray-600" />;
      case 'paypal':
        return <span className="text-blue-600 font-bold">PayPal</span>;
      case 'apple-pay':
        return <span className="text-black font-bold">Apple Pay</span>;
      default:
        return <CreditCard size={20} className="text-gray-600" />;
    }
  };

  const setDefaultMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const deleteMethod = (id: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your payment methods for faster checkout</p>
        </div>

        <div className="divide-y divide-gray-200">
          {paymentMethods.map((method) => (
            <div key={method.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-4">
                    {getPaymentIcon(method.type)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{method.name}</div>
                    {method.type === 'credit-card' && (
                      <div className="text-sm text-gray-600">
                        Expires {method.expiryDate}
                      </div>
                    )}
                    {method.type === 'paypal' && (
                      <div className="text-sm text-gray-600">
                        {method.email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Default
                    </span>
                  )}
                  
                  {!method.isDefault && (
                    <button
                      onClick={() => setDefaultMethod(method.id)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Set as Default
                    </button>
                  )}

                  <button
                    onClick={() => setEditingMethod(method)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => deleteMethod(method.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Lock size={20} className="text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Secure Payment Storage</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your payment information is encrypted and stored securely. We use industry-standard SSL encryption to protect your data.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Payment Method Modal */}
      {(showAddModal || editingMethod) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="credit-card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="apple-pay">Apple Pay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="default"
                  className="mr-2"
                />
                <label htmlFor="default" className="text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMethod(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  {editingMethod ? 'Update' : 'Add'} Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 