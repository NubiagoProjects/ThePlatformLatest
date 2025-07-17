/**
 * Payment Error UI Components
 * Handles timeout retry, payment failed feedback, instructions fallback
 * Comprehensive error handling for all payment scenarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  XCircle, 
  Clock, 
  Wifi, 
  Phone, 
  CreditCard, 
  ArrowLeft,
  HelpCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  Smartphone
} from 'lucide-react';

interface PaymentErrorUIProps {
  errorType: 'timeout' | 'failed' | 'network' | 'insufficient_funds' | 'invalid_phone' | 'provider_error' | 'unknown';
  onRetry?: () => void;
  onCancel?: () => void;
  onContactSupport?: () => void;
  retryCount?: number;
  maxRetries?: number;
  paymentDetails?: {
    amount: number;
    currency: string;
    provider: string;
    phone: string;
  };
  customMessage?: string;
  showInstructions?: boolean;
}

interface PaymentTimeoutUIProps {
  onRetry: () => void;
  onCancel: () => void;
  retryCount: number;
  maxRetries: number;
  timeoutDuration?: number;
}

interface PaymentFailedUIProps {
  errorCode?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onCancel: () => void;
  paymentDetails?: {
    amount: number;
    currency: string;
    provider: string;
    phone: string;
  };
}

interface PaymentInstructionsUIProps {
  provider: string;
  amount: number;
  currency: string;
  phone: string;
  ussdCode?: string;
  onCompleted?: () => void;
  onCancel?: () => void;
}

// Main Payment Error UI Component
export function PaymentErrorUI({
  errorType,
  onRetry,
  onCancel,
  onContactSupport,
  retryCount = 0,
  maxRetries = 3,
  paymentDetails,
  customMessage,
  showInstructions = false
}: PaymentErrorUIProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getErrorConfig = () => {
    switch (errorType) {
      case 'timeout':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-600" />,
          title: 'Payment Timeout',
          message: customMessage || 'Your payment is taking longer than expected. This might be due to network issues or high traffic.',
          color: 'yellow',
          canRetry: retryCount < maxRetries,
          showSupport: true
        };
      case 'failed':
        return {
          icon: <XCircle className="w-16 h-16 text-red-600" />,
          title: 'Payment Failed',
          message: customMessage || 'Your payment could not be processed. Please check your details and try again.',
          color: 'red',
          canRetry: retryCount < maxRetries,
          showSupport: true
        };
      case 'network':
        return {
          icon: <Wifi className="w-16 h-16 text-orange-600" />,
          title: 'Network Error',
          message: customMessage || 'Unable to connect to payment services. Please check your internet connection.',
          color: 'orange',
          canRetry: true,
          showSupport: false
        };
      case 'insufficient_funds':
        return {
          icon: <CreditCard className="w-16 h-16 text-red-600" />,
          title: 'Insufficient Funds',
          message: customMessage || 'Your account doesn\'t have enough balance for this transaction.',
          color: 'red',
          canRetry: false,
          showSupport: true
        };
      case 'invalid_phone':
        return {
          icon: <Phone className="w-16 h-16 text-red-600" />,
          title: 'Invalid Phone Number',
          message: customMessage || 'The phone number provided is not valid for the selected mobile money provider.',
          color: 'red',
          canRetry: false,
          showSupport: true
        };
      case 'provider_error':
        return {
          icon: <Smartphone className="w-16 h-16 text-red-600" />,
          title: 'Provider Error',
          message: customMessage || 'The mobile money provider is currently unavailable. Please try again later.',
          color: 'red',
          canRetry: retryCount < maxRetries,
          showSupport: true
        };
      default:
        return {
          icon: <AlertCircle className="w-16 h-16 text-gray-600" />,
          title: 'Payment Error',
          message: customMessage || 'An unexpected error occurred. Please try again or contact support.',
          color: 'gray',
          canRetry: retryCount < maxRetries,
          showSupport: true
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600">{config.message}</p>
        </div>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{paymentDetails.currency} {paymentDetails.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-medium">{paymentDetails.provider}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{paymentDetails.phone}</span>
              </div>
            </div>
          </div>
        )}

        {/* Retry Count */}
        {retryCount > 0 && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">
              Attempt {retryCount} of {maxRetries}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {config.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className={`w-full flex items-center justify-center px-4 py-3 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 transition-colors font-medium`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Go Back
            </button>
          )}

          {config.showSupport && onContactSupport && (
            <button
              onClick={onContactSupport}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Contact Support
            </button>
          )}
        </div>

        {/* Instructions for specific errors */}
        {showInstructions && paymentDetails && (
          <PaymentInstructionsFallback
            provider={paymentDetails.provider}
            amount={paymentDetails.amount}
            currency={paymentDetails.currency}
            phone={paymentDetails.phone}
          />
        )}
      </div>
    </div>
  );
}

// Payment Timeout UI
export function PaymentTimeoutUI({
  onRetry,
  onCancel,
  retryCount,
  maxRetries,
  timeoutDuration = 30
}: PaymentTimeoutUIProps) {
  const [countdown, setCountdown] = useState(timeoutDuration);
  const [autoRetry, setAutoRetry] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoRetry && retryCount < maxRetries) {
      onRetry();
    }
  }, [countdown, autoRetry, retryCount, maxRetries, onRetry]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Timeout</h1>
          <p className="text-gray-600">
            Your payment is taking longer than expected. This might be due to network issues.
          </p>
        </div>

        {countdown > 0 && autoRetry && (
          <div className="mb-6">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-600">{countdown}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Auto-retry in {countdown} seconds...</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Now ({retryCount}/{maxRetries})
          </button>

          <label className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRetry}
              onChange={(e) => setAutoRetry(e.target.checked)}
              className="rounded"
            />
            <span>Auto-retry when countdown ends</span>
          </label>

          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Failed UI
export function PaymentFailedUI({
  errorCode,
  errorMessage,
  onRetry,
  onCancel,
  paymentDetails
}: PaymentFailedUIProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getFailureReason = () => {
    if (errorCode) {
      const reasons: Record<string, string> = {
        'INSUFFICIENT_FUNDS': 'Your account doesn\'t have enough balance for this transaction.',
        'INVALID_PIN': 'The PIN entered is incorrect. Please check and try again.',
        'ACCOUNT_BLOCKED': 'Your mobile money account appears to be blocked. Contact your provider.',
        'TRANSACTION_LIMIT': 'This transaction exceeds your daily limit.',
        'NETWORK_ERROR': 'Network connectivity issues prevented the transaction.',
        'PROVIDER_DOWN': 'The mobile money service is temporarily unavailable.',
        'INVALID_NUMBER': 'The phone number is not registered for mobile money services.'
      };
      return reasons[errorCode] || errorMessage || 'An unknown error occurred.';
    }
    return errorMessage || 'Your payment could not be processed. Please try again.';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">{getFailureReason()}</p>
        </div>

        {paymentDetails && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">Failed Transaction</h3>
            <div className="space-y-1 text-sm text-red-700">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{paymentDetails.currency} {paymentDetails.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-medium">{paymentDetails.provider}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{paymentDetails.phone}</span>
              </div>
            </div>
          </div>
        )}

        {errorCode && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                Error Code: {errorCode}
                {errorMessage && (
                  <>
                    <br />
                    Message: {errorMessage}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}

          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back to Checkout
          </button>

          <div className="text-center">
            <a
              href="mailto:support@nubiago.com"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Need help? Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Instructions Fallback UI
export function PaymentInstructionsFallback({
  provider,
  amount,
  currency,
  phone,
  ussdCode,
  onCompleted,
  onCancel
}: PaymentInstructionsUIProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getInstructions = () => {
    const instructions: Record<string, { ussd: string; steps: string[] }> = {
      'M-Pesa': {
        ussd: '*334#',
        steps: [
          'Dial *334# on your phone',
          'Select "Send Money"',
          'Enter the merchant number provided',
          `Enter amount: ${amount} ${currency}`,
          'Enter your M-Pesa PIN',
          'Confirm the transaction'
        ]
      },
      'Airtel Money': {
        ussd: '*185#',
        steps: [
          'Dial *185# on your phone',
          'Select "Make Payment"',
          'Enter the merchant code',
          `Enter amount: ${amount} ${currency}`,
          'Enter your Airtel Money PIN',
          'Confirm the payment'
        ]
      },
      'MTN MoMo': {
        ussd: '*170#',
        steps: [
          'Dial *170# on your phone',
          'Select "Transfer Money"',
          'Select "To Registered Number"',
          'Enter the merchant number',
          `Enter amount: ${amount} ${currency}`,
          'Enter your MOMO PIN',
          'Confirm the transaction'
        ]
      }
    };

    return instructions[provider] || {
      ussd: ussdCode || '*000#',
      steps: [
        `Dial ${ussdCode || 'your provider\'s USSD code'}`,
        'Follow the payment menu',
        `Send ${amount} ${currency} to the merchant`,
        'Complete the transaction with your PIN'
      ]
    };
  };

  const instructions = getInstructions();

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start mb-4">
        <HelpCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-blue-900">Manual Payment Instructions</h3>
          <p className="text-sm text-blue-700 mt-1">
            Complete your payment using {provider} on your phone
          </p>
        </div>
      </div>

      {/* USSD Code */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded">
          <div>
            <p className="text-sm font-medium text-gray-700">USSD Code</p>
            <p className="text-lg font-mono text-gray-900">{instructions.ussd}</p>
          </div>
          <button
            onClick={() => copyToClipboard(instructions.ussd, 'ussd')}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded"
          >
            {copied === 'ussd' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Steps to Complete Payment:</h4>
        <ol className="space-y-2">
          {instructions.steps.map((step, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center justify-center mr-2 mt-0.5">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        {onCompleted && (
          <button
            onClick={onCompleted}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            I've Completed Payment
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default PaymentErrorUI; 