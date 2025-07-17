/**
 * Mobile Money Payment Form Usage Example
 * Demonstrates how to integrate the MobileMoneyPaymentForm component
 */

'use client';

import React, { useState } from 'react';
import { MobileMoneyPaymentForm } from '@/modules/payments/components/MobileMoneyPaymentForm';
import type { MobileMoneyProvider } from '@/modules/payments/types';

export const MobileMoneyPaymentExample: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>('MTN_MOMO');
  const [amount, setAmount] = useState<number>(150.00);
  const [result, setResult] = useState<any>(null);

  const handlePaymentSuccess = (response: any) => {
    console.log('Payment successful:', response);
    setResult({ type: 'success', data: response });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setResult({ type: 'error', message: error });
  };

  const handlePaymentSubmit = (formData: any) => {
    console.log('Payment form submitted:', formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Mobile Money Payment Form
        </h1>
        <p className="text-gray-600">
          Complete implementation with validation, provider logos, and API integration
        </p>
      </div>

      {/* Configuration Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NG">Nigeria</option>
              <option value="KE">Kenya</option>
              <option value="UG">Uganda</option>
              <option value="GH">Ghana</option>
              <option value="TZ">Tanzania</option>
              <option value="SN">Senegal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as MobileMoneyProvider)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MTN_MOMO">MTN Mobile Money</option>
              <option value="MPESA">M-Pesa</option>
              <option value="VODAFONE_CASH">Vodafone Cash</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="TIGO_CASH">Tigo Cash</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="WAVE">Wave</option>
              <option value="FLOOZ">Flooz</option>
              <option value="MOOV_MONEY">Moov Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="1"
              max="10000"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <MobileMoneyPaymentForm
        country={selectedCountry}
        provider={selectedProvider}
        amount={amount}
        currency="USD"
        orderId={`ORD-${Date.now()}`}
        onSubmit={handlePaymentSubmit}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        className="shadow-lg"
      />

      {/* Result Display */}
      {result && (
        <div className={`p-6 rounded-lg border ${
          result.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            result.type === 'success' ? 'text-green-900' : 'text-red-900'
          }`}>
            {result.type === 'success' ? 'Payment Success' : 'Payment Error'}
          </h3>
          
          {result.type === 'success' ? (
            <div className="space-y-2">
              <p><strong>Transaction ID:</strong> {result.data.transactionId}</p>
              <p><strong>Reference:</strong> {result.data.reference}</p>
              <p><strong>Message:</strong> {result.data.message}</p>
            </div>
          ) : (
            <p className="text-red-700">{result.message}</p>
          )}
          
          <button
            onClick={() => setResult(null)}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Clear Result
          </button>
        </div>
      )}

      {/* Usage Example Code */}
      <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-white">Usage Example</h3>
        <pre className="text-sm">
{`import { MobileMoneyPaymentForm } from '@/modules/payments';

<MobileMoneyPaymentForm
  country="${selectedCountry}"
  provider="${selectedProvider}"
  amount={${amount}}
  currency="USD"
  orderId="ORD-123456"
  onSubmit={(data) => console.log('Form submitted:', data)}
  onSuccess={(response) => console.log('Payment success:', response)}
  onError={(error) => console.error('Payment error:', error)}
/>`}
        </pre>
      </div>

      {/* Features List */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          ✅ Implemented Features
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>✓ Accepts country, provider, phone number, and amount props</li>
          <li>✓ Shows provider logos and instructions</li>
          <li>✓ Validates phone number format by country and provider</li>
          <li>✓ Validates amount limits for each provider</li>
          <li>✓ Submits to /api/payments/initiate endpoint</li>
          <li>✓ Responsive design for mobile and desktop</li>
          <li>✓ Real-time form validation and error handling</li>
          <li>✓ Payment fee calculation and total display</li>
          <li>✓ Provider-specific USSD codes and instructions</li>
          <li>✓ Secure payment processing with loading states</li>
        </ul>
      </div>
    </div>
  );
}; 