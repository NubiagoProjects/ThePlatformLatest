/**
 * Enhanced Payment Gateway with Dynamic Location-Based Provider Selection
 * Integrates GeoIP detection with mobile money provider matching
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Smartphone, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { DynamicProviderSelector } from './DynamicProviderSelector';
import { PaymentGateway } from './PaymentGateway';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { MobileMoneyProvider } from '@/modules/payments/types';

interface PaymentGatewayWithLocationProps {
  amount: number;
  currency: string;
  orderId?: string;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  onPaymentCancel?: () => void;
  className?: string;
}

interface PaymentState {
  selectedMethod: 'mobile_money' | 'crypto' | 'card' | null;
  selectedProvider: MobileMoneyProvider | null;
  selectedCountry: string | null;
  isProcessing: boolean;
  error: string | null;
  step: 'selection' | 'provider' | 'payment' | 'confirmation';
}

export const PaymentGatewayWithLocation: React.FC<PaymentGatewayWithLocationProps> = ({
  amount,
  currency,
  orderId,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  className = ''
}) => {
  const {
    location,
    countryCode,
    isLoading: locationLoading,
    error: locationError,
    isSupported,
    providers,
    hasProviders
  } = useUserLocation();

  const [paymentState, setPaymentState] = useState<PaymentState>({
    selectedMethod: null,
    selectedProvider: null,
    selectedCountry: null,
    isProcessing: false,
    error: null,
    step: 'selection'
  });

  // Update country when location is detected
  useEffect(() => {
    if (countryCode && !paymentState.selectedCountry) {
      setPaymentState(prev => ({
        ...prev,
        selectedCountry: countryCode
      }));
    }
  }, [countryCode, paymentState.selectedCountry]);

  const handleMethodSelection = useCallback((method: 'mobile_money' | 'crypto' | 'card') => {
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: method,
      step: method === 'mobile_money' ? 'provider' : 'payment',
      error: null
    }));
  }, []);

  const handleProviderSelection = useCallback((provider: MobileMoneyProvider, country: string) => {
    setPaymentState(prev => ({
      ...prev,
      selectedProvider: provider,
      selectedCountry: country,
      step: 'payment',
      error: null
    }));
  }, []);

  const handleLocationChange = useCallback((country: string) => {
    setPaymentState(prev => ({
      ...prev,
      selectedCountry: country,
      selectedProvider: null, // Reset provider when country changes
      error: null
    }));
  }, []);

  const handleBackToSelection = useCallback(() => {
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: null,
      selectedProvider: null,
      step: 'selection',
      error: null
    }));
  }, []);

  const handleBackToProvider = useCallback(() => {
    setPaymentState(prev => ({
      ...prev,
      selectedProvider: null,
      step: 'provider',
      error: null
    }));
  }, []);

  const handlePaymentProcess = useCallback(async (paymentData: any) => {
    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Enhanced payment processing with location context
      const enhancedPaymentData = {
        ...paymentData,
        location: {
          country: paymentState.selectedCountry,
          detectedLocation: location,
          isAutoDetected: countryCode === paymentState.selectedCountry
        },
        provider: paymentState.selectedProvider,
        amount,
        currency,
        orderId
      };

      // Here you would call your payment processing API
      console.log('Processing payment with location context:', enhancedPaymentData);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const transactionId = `TXN_${Date.now()}`;
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        step: 'confirmation' 
      }));

      if (onPaymentSuccess) {
        onPaymentSuccess(transactionId);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage 
      }));

      if (onPaymentError) {
        onPaymentError(errorMessage);
      }
    }
  }, [
    paymentState.selectedCountry,
    paymentState.selectedProvider,
    location,
    countryCode,
    amount,
    currency,
    orderId,
    onPaymentSuccess,
    onPaymentError
  ]);

  // Location loading state
  if (locationLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Setting up payment options</h3>
        <p className="text-gray-600">Detecting your location for optimal payment methods...</p>
      </div>
    );
  }

  // Payment method selection
  if (paymentState.step === 'selection') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Choose Payment Method</h2>
          {location && (
            <p className="text-sm text-gray-600 mt-1">
              Payment options for {location.country} ({location.countryCode})
            </p>
          )}
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-100">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Location Detection Limited</p>
                <p className="text-sm text-yellow-700">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="p-6 space-y-4">
          {/* Mobile Money */}
          <div
            onClick={() => handleMethodSelection('mobile_money')}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
              !isSupported && !hasProviders ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">Mobile Money</h3>
                <p className="text-sm text-gray-600">
                  {hasProviders 
                    ? `${providers.length} provider(s) available in your region`
                    : 'Pay with MTN, Airtel, M-Pesa and more'
                  }
                </p>
              </div>
              {hasProviders && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>

          {/* Cryptocurrency */}
          <div
            onClick={() => handleMethodSelection('crypto')}
            className="p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">Cryptocurrency</h3>
                <p className="text-sm text-gray-600">Pay with USDT, USDC, BTC via Yellow Card</p>
              </div>
            </div>
          </div>

          {/* Credit Card */}
          <div
            onClick={() => handleMethodSelection('card')}
            className="p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">Credit/Debit Card</h3>
                <p className="text-sm text-gray-600">Visa, Mastercard, Verve</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Provider selection for mobile money
  if (paymentState.step === 'provider' && paymentState.selectedMethod === 'mobile_money') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Back button */}
        <button
          onClick={handleBackToSelection}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to payment methods
        </button>

        <DynamicProviderSelector
          onProviderSelect={handleProviderSelection}
          onLocationChange={handleLocationChange}
          showCountrySelector={true}
          showInstructions={true}
          className="w-full"
        />
      </div>
    );
  }

  // Payment processing
  if (paymentState.step === 'payment') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Back button */}
        <button
          onClick={paymentState.selectedMethod === 'mobile_money' ? handleBackToProvider : handleBackToSelection}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to {paymentState.selectedMethod === 'mobile_money' ? 'provider selection' : 'payment methods'}
        </button>

        {/* Error display */}
        {paymentState.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">Payment Error</p>
                <p className="text-sm text-red-700">{paymentState.error}</p>
              </div>
            </div>
          </div>
        )}

        <PaymentGateway
          amount={amount}
          currency={currency}
          paymentMethod={paymentState.selectedMethod}
          selectedProvider={paymentState.selectedProvider}
          selectedCountry={paymentState.selectedCountry}
          orderId={orderId}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          onPaymentCancel={onPaymentCancel}
          isProcessing={paymentState.isProcessing}
          onPaymentProcess={handlePaymentProcess}
        />
      </div>
    );
  }

  // Confirmation
  if (paymentState.step === 'confirmation') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          Your payment has been processed successfully.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500">Order ID: {orderId}</p>
        )}
      </div>
    );
  }

  return null;
}; 