/**
 * Mobile Money Flow Component
 * Handles the complete mobile money payment flow including form submission
 * Integrates with MobileMoneyPaymentForm for seamless user experience
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MobileMoneyPaymentForm } from './MobileMoneyPaymentForm';
import { DynamicProviderSelector } from './DynamicProviderSelector';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import type { MobileMoneyProvider, PaymentMethod } from '../types';

export interface MobileMoneyFlowProps {
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  targetCurrency?: string;
  orderId?: string;
  onPaymentCreated: (paymentIntent: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface PaymentFlowState {
  step: 'provider-selection' | 'payment-form' | 'processing' | 'success' | 'error';
  selectedCountry?: string;
  selectedProvider?: MobileMoneyProvider;
  phoneNumber?: string;
  transactionId?: string;
  reference?: string;
  instructions?: {
    steps: string[];
    ussdCode?: string;
    reference: string;
  };
  error?: string;
}

export const MobileMoneyFlow: React.FC<MobileMoneyFlowProps> = ({
  paymentMethod,
  amount,
  currency,
  targetCurrency,
  orderId,
  onPaymentCreated,
  onError,
  onCancel,
  className = ''
}) => {
  const [flowState, setFlowState] = useState<PaymentFlowState>({
    step: 'provider-selection'
  });

  const [isLoading, setIsLoading] = useState(false);

  // Handle provider selection from DynamicProviderSelector
  const handleProviderSelect = useCallback((provider: MobileMoneyProvider, country: string) => {
    setFlowState(prev => ({
      ...prev,
      step: 'payment-form',
      selectedProvider: provider,
      selectedCountry: country
    }));
  }, []);

  // Handle going back to provider selection
  const handleBackToProviders = useCallback(() => {
    setFlowState(prev => ({
      ...prev,
      step: 'provider-selection',
      selectedProvider: undefined,
      selectedCountry: undefined,
      error: undefined
    }));
  }, []);

  // Handle payment form submission
  const handlePaymentSubmit = useCallback(async (formData: any) => {
    setIsLoading(true);
    setFlowState(prev => ({ ...prev, step: 'processing', error: undefined }));

    try {
      // The form will handle the API call, we just update the flow state
      console.log('Payment form submitted:', formData);
    } catch (error) {
      console.error('Payment submission error:', error);
      setFlowState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Payment submission failed'
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle successful payment
  const handlePaymentSuccess = useCallback((response: any) => {
    setFlowState(prev => ({
      ...prev,
      step: 'success',
      transactionId: response.transactionId,
      reference: response.reference,
      instructions: response.instructions
    }));

    // Call the parent callback
    onPaymentCreated({
      id: response.transactionId,
      reference: response.reference,
      amount,
      currency,
      status: 'PENDING',
      provider: flowState.selectedProvider,
      country: flowState.selectedCountry
    });
  }, [amount, currency, flowState.selectedProvider, flowState.selectedCountry, onPaymentCreated]);

  // Handle payment error
  const handlePaymentError = useCallback((error: string) => {
    setFlowState(prev => ({
      ...prev,
      step: 'error',
      error
    }));
    onError(error);
  }, [onError]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setFlowState(prev => ({
      ...prev,
      step: 'payment-form',
      error: undefined
    }));
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Render based on current step
  const renderStep = () => {
    switch (flowState.step) {
      case 'provider-selection':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Choose Mobile Money Provider
              </h2>
              <p className="text-gray-600">
                Select your preferred mobile money service for payment
              </p>
            </div>

            <DynamicProviderSelector
              onProviderSelect={handleProviderSelect}
              showCountrySelector={true}
              showInstructions={false}
              compact={false}
            />

            {onCancel && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel Payment
                </button>
              </div>
            )}
          </div>
        );

      case 'payment-form':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={handleBackToProviders}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Complete Payment
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your payment details
                </p>
              </div>
            </div>

            {flowState.selectedProvider && flowState.selectedCountry && (
              <MobileMoneyPaymentForm
                country={flowState.selectedCountry}
                provider={flowState.selectedProvider}
                amount={amount}
                currency={currency}
                orderId={orderId}
                onSubmit={handlePaymentSubmit}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handleBackToProviders}
                disabled={isLoading}
              />
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Processing Payment
            </h3>
            <p className="text-gray-600">
              Please wait while we process your payment...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Initiated Successfully
            </h3>
            <p className="text-gray-600 mb-6">
              Please complete your payment using the instructions below
            </p>

            {flowState.reference && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Payment Reference:</p>
                <p className="font-mono text-lg font-semibold text-gray-900">
                  {flowState.reference}
                </p>
              </div>
            )}

            {flowState.instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Complete Your Payment
                </h4>
                
                {flowState.instructions.ussdCode && (
                  <div className="mb-4 p-3 bg-blue-100 rounded border">
                    <p className="text-sm text-blue-700 mb-1">Dial:</p>
                    <p className="font-mono text-xl font-bold text-blue-900">
                      {flowState.instructions.ussdCode}
                    </p>
                  </div>
                )}

                <ol className="space-y-2 text-sm text-blue-800">
                  {flowState.instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 text-xs rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
              <button
                onClick={handleBackToProviders}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Make Another Payment
              </button>
              
              {flowState.transactionId && (
                <button
                  onClick={() => window.open(`/payment/status/${flowState.transactionId}`, '_blank')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Check Payment Status</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Failed
            </h3>
            <p className="text-gray-600 mb-6">
              {flowState.error || 'An unexpected error occurred'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={handleBackToProviders}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Choose Different Provider
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {renderStep()}
    </div>
  );
}; 