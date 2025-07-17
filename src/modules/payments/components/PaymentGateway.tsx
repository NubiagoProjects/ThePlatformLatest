'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentGatewayProps, PaymentFlowState, PaymentIntent, PaymentFormData } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentIntent } from '../hooks/usePaymentIntent';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { MobileMoneyFlow } from './MobileMoneyFlow';
import { CryptoConversion } from './CryptoConversion';
import { PaymentStatus } from './PaymentStatus';
import { WalletBalance } from './WalletBalance';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  Smartphone, 
  ArrowLeft, 
  Shield, 
  Clock,
  TrendingUp,
  Wallet
} from 'lucide-react';

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  orderId,
  amount: initialAmount,
  currency: initialCurrency = 'NGN',
  onSuccess,
  onError,
  onCancel,
  className = ''
}) => {
  // State management
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlowState>({
    step: 'select-method',
    loading: false
  });

  const [formData, setFormData] = useState<Partial<PaymentFormData>>({
    amount: initialAmount,
    currency: initialCurrency,
    orderId
  });

  // Hooks
  const { paymentMethods, loading: methodsLoading, error: methodsError } = usePaymentMethods();
  const { 
    paymentIntent, 
    loading: intentLoading, 
    createPaymentIntent, 
    checkPaymentStatus, 
    cancelPayment 
  } = usePaymentIntent();
  const { wallets, totalBalanceUSD, refetch: refetchWallets } = useWalletBalance();
  const { getRate, convertAmount } = useExchangeRates();

  // Auto-refresh payment status
  useEffect(() => {
    if (paymentIntent && ['PENDING', 'PROCESSING'].includes(paymentIntent.status)) {
      const interval = setInterval(async () => {
        try {
          const updated = await checkPaymentStatus(paymentIntent.id);
          if (['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(updated.status)) {
            setPaymentFlow(prev => ({
              ...prev,
              step: updated.status === 'COMPLETED' ? 'success' : 'failed',
              paymentIntent: updated
            }));
            
            if (updated.status === 'COMPLETED' && onSuccess) {
              onSuccess(updated);
              await refetchWallets(); // Refresh wallet balances
            } else if (updated.status === 'FAILED' && onError) {
              onError(updated.failedReason || 'Payment failed');
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [paymentIntent, checkPaymentStatus, onSuccess, onError, refetchWallets]);

  // Handle method selection
  const handleMethodSelect = useCallback((method: any) => {
    setPaymentFlow(prev => ({
      ...prev,
      step: 'enter-details',
      paymentMethod: method
    }));
  }, []);

  // Handle payment form submission
  const handlePaymentSubmit = useCallback(async (data: PaymentFormData) => {
    setPaymentFlow(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const intent = await createPaymentIntent(data);
      setPaymentFlow(prev => ({
        ...prev,
        step: 'processing',
        paymentIntent: intent,
        formData: data,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment creation failed';
      setPaymentFlow(prev => ({
        ...prev,
        step: 'failed',
        error: errorMessage,
        loading: false
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [createPaymentIntent, onError]);

  // Handle payment cancellation
  const handleCancel = useCallback(async () => {
    if (paymentIntent && ['PENDING', 'PROCESSING'].includes(paymentIntent.status)) {
      try {
        await cancelPayment(paymentIntent.id);
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    }
    
    setPaymentFlow({
      step: 'select-method',
      loading: false
    });
    
    if (onCancel) {
      onCancel();
    }
  }, [paymentIntent, cancelPayment, onCancel]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setPaymentFlow(prev => ({
      ...prev,
      step: 'enter-details',
      error: undefined
    }));
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (paymentFlow.step) {
      case 'enter-details':
        setPaymentFlow(prev => ({ ...prev, step: 'select-method' }));
        break;
      case 'confirm':
        setPaymentFlow(prev => ({ ...prev, step: 'enter-details' }));
        break;
      default:
        if (onCancel) {
          onCancel();
        }
    }
  }, [paymentFlow.step, onCancel]);

  // Calculate conversion amounts
  const getConversionInfo = useCallback((fromCurrency: string, toCurrency?: string, amount?: number) => {
    if (!toCurrency || !amount) return null;
    
    const rate = getRate(fromCurrency as any, toCurrency as any);
    if (!rate) return null;
    
    const convertedAmount = convertAmount(amount, fromCurrency as any, toCurrency as any);
    return { rate, convertedAmount };
  }, [getRate, convertAmount]);

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'select-method', label: 'Payment Method', icon: CreditCard },
      { key: 'enter-details', label: 'Details', icon: Smartphone },
      { key: 'confirm', label: 'Confirm', icon: Shield },
      { key: 'processing', label: 'Processing', icon: Clock }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === paymentFlow.step);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <React.Fragment key={step.key}>
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-400'
                }
                ${isCurrent ? 'ring-4 ring-blue-200' : ''}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  h-0.5 w-12 mx-2 transition-all duration-300
                  ${index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Render wallet summary
  const renderWalletSummary = () => {
    if (wallets.length === 0) return null;

    return (
      <Card className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Your Wallet Balance</p>
              <p className="text-sm text-gray-600">
                ${totalBalanceUSD.toFixed(2)} USD equivalent
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">
              {wallets.filter(w => parseFloat(w.balance.toString()) > 0).length} active
            </span>
          </div>
        </div>
      </Card>
    );
  };

  // Main render
  if (methodsLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <LoadingSpinner className="mx-auto" />
        <p className="text-center text-gray-600 mt-4">Loading payment methods...</p>
      </Card>
    );
  }

  if (methodsError) {
    return (
      <Card className={`p-8 ${className}`}>
        <ErrorAlert 
          message={methodsError}
          onRetry={() => window.location.reload()}
        />
      </Card>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Secure Payment Gateway
        </h1>
        <p className="text-gray-600">
          Convert Mobile Money to crypto seamlessly with Yellow Card
        </p>
      </div>

      {/* Step Indicator */}
      {!['success', 'failed'].includes(paymentFlow.step) && renderStepIndicator()}

      {/* Wallet Summary */}
      {renderWalletSummary()}

      {/* Back Button */}
      {['enter-details', 'confirm'].includes(paymentFlow.step) && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
          disabled={paymentFlow.loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {/* Main Content */}
      <Card className="p-6">
        <AnimatePresence mode="wait">
          {paymentFlow.step === 'select-method' && (
            <motion.div
              key="select-method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PaymentMethodSelector
                selectedMethod={paymentFlow.paymentMethod}
                onMethodSelect={handleMethodSelect}
                amount={formData.amount}
                currency={formData.currency}
              />
            </motion.div>
          )}

          {paymentFlow.step === 'enter-details' && paymentFlow.paymentMethod && (
            <motion.div
              key="enter-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MobileMoneyFlow
                paymentMethod={paymentFlow.paymentMethod}
                amount={formData.amount || 0}
                currency={formData.currency || 'NGN'}
                targetCurrency="USDT"
                onPaymentCreated={(intent) => {
                  setPaymentFlow(prev => ({
                    ...prev,
                    step: 'processing',
                    paymentIntent: intent
                  }));
                }}
                onError={(error) => {
                  setPaymentFlow(prev => ({
                    ...prev,
                    step: 'failed',
                    error
                  }));
                  if (onError) onError(error);
                }}
              />
            </motion.div>
          )}

          {['processing', 'success', 'failed'].includes(paymentFlow.step) && paymentFlow.paymentIntent && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PaymentStatus
                paymentIntent={paymentFlow.paymentIntent}
                onRetry={handleRetry}
                onCancel={handleCancel}
                onClose={() => {
                  if (paymentFlow.paymentIntent?.status === 'COMPLETED' && onSuccess) {
                    onSuccess(paymentFlow.paymentIntent);
                  } else if (onCancel) {
                    onCancel();
                  }
                }}
              />
            </motion.div>
          )}

          {paymentFlow.error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorAlert 
                message={paymentFlow.error}
                onRetry={handleRetry}
                onClose={() => setPaymentFlow(prev => ({ ...prev, error: undefined }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Footer */}
      <div className="text-center mt-6 text-sm text-gray-500">
        <p>Powered by Yellow Card • Secure • Fast • Reliable</p>
      </div>
    </div>
  );
};

export default PaymentGateway; 