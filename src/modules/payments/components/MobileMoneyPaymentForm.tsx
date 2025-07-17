/**
 * Mobile Money Payment Form UI Component
 * Accepts: country, provider, phone number, amount
 * Shows provider logos and instructions
 * Validates phone + provider compatibility
 * Submits to /api/payments/initiate
 * Responsive design for mobile and desktop
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  CreditCard, 
  Smartphone, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Phone, 
  DollarSign,
  Info,
  Shield,
  Clock
} from 'lucide-react';
import { MOBILE_MONEY_PROVIDERS, getCountryByCode } from '@/modules/payments/constants/countries';
import type { MobileMoneyProvider } from '@/modules/payments/types';

interface MobileMoneyPaymentFormProps {
  country: string;
  provider: MobileMoneyProvider;
  phoneNumber?: string;
  amount: number;
  currency?: string;
  orderId?: string;
  onSubmit?: (data: PaymentFormData) => void;
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
}

interface PaymentFormData {
  country: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: string;
  orderId?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  message: string;
  redirectUrl?: string;
}

interface ValidationErrors {
  phoneNumber?: string;
  amount?: string;
  provider?: string;
  general?: string;
}

export const MobileMoneyPaymentForm: React.FC<MobileMoneyPaymentFormProps> = ({
  country,
  provider,
  phoneNumber: initialPhoneNumber = '',
  amount,
  currency = 'USD',
  orderId,
  onSubmit,
  onSuccess,
  onError,
  onCancel,
  className = '',
  disabled = false
}) => {
  // State management
  const [formData, setFormData] = useState<PaymentFormData>({
    country,
    provider,
    phoneNumber: initialPhoneNumber,
    amount,
    currency,
    orderId
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Get provider details
  const providerDetails = MOBILE_MONEY_PROVIDERS[provider];
  const countryDetails = getCountryByCode(country);

  // Phone number validation patterns by country and provider
  const getPhoneValidationPattern = useCallback((countryCode: string, providerCode: MobileMoneyProvider) => {
    const patterns: Record<string, Record<string, RegExp>> = {
      'NG': {
        'MTN_MOMO': /^(\+234|234|0)?[789][01]\d{8}$/,
      },
      'KE': {
        'MPESA': /^(\+254|254|0)?[17]\d{8}$/,
      },
      'UG': {
        'MTN_MOMO': /^(\+256|256|0)?[37]\d{8}$/,
      },
      'GH': {
        'MTN_MOMO': /^(\+233|233|0)?[235]\d{8}$/,
        'VODAFONE_CASH': /^(\+233|233|0)?[235]\d{8}$/,
      },
      'TZ': {
        'TIGO_CASH': /^(\+255|255|0)?[67]\d{8}$/,
        'AIRTEL_MONEY': /^(\+255|255|0)?[67]\d{8}$/,
      },
      'SN': {
        'ORANGE_MONEY': /^(\+221|221|0)?[37]\d{8}$/,
        'WAVE': /^(\+221|221|0)?[37]\d{8}$/,
      }
    };

    return patterns[countryCode]?.[providerCode] || /^(\+\d{1,3})?\d{9,15}$/;
  }, []);

  // Format phone number for display
  const formatPhoneNumber = useCallback((phone: string, countryCode: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    const formats: Record<string, (num: string) => string> = {
      'NG': (num) => {
        if (num.startsWith('234')) num = num.slice(3);
        if (num.startsWith('0')) num = num.slice(1);
        return `+234 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
      },
      'KE': (num) => {
        if (num.startsWith('254')) num = num.slice(3);
        if (num.startsWith('0')) num = num.slice(1);
        return `+254 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
      }
    };

    return formats[countryCode]?.(cleaned) || phone;
  }, []);

  // Validate phone number
  const validatePhoneNumber = useCallback((phone: string) => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }

    const pattern = getPhoneValidationPattern(country, provider);
    const cleanPhone = phone.replace(/\s+/g, '');

    if (!pattern.test(cleanPhone)) {
      return `Invalid phone number format for ${providerDetails?.name || provider}`;
    }

    // Check if provider supports this phone number prefix
    if (!providerDetails?.countries.includes(country)) {
      return `${providerDetails?.name || provider} is not available in ${countryDetails?.name || country}`;
    }

    return null;
  }, [country, provider, providerDetails, countryDetails, getPhoneValidationPattern]);

  // Validate amount
  const validateAmount = useCallback((amt: number) => {
    if (!amt || amt <= 0) {
      return 'Amount must be greater than 0';
    }

    if (providerDetails) {
      if (amt < providerDetails.minAmount) {
        return `Minimum amount is ${providerDetails.feeStructure.currency} ${providerDetails.minAmount.toLocaleString()}`;
      }
      if (amt > providerDetails.maxAmount) {
        return `Maximum amount is ${providerDetails.feeStructure.currency} ${providerDetails.maxAmount.toLocaleString()}`;
      }
    }

    return null;
  }, [providerDetails]);

  // Calculate fees
  const calculateFee = useCallback((amt: number) => {
    if (!providerDetails) return 0;
    
    const { percentage, fixed } = providerDetails.feeStructure;
    return (amt * percentage / 100) + fixed;
  }, [providerDetails]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: ValidationErrors = {};

    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    const amountError = validateAmount(formData.amount);
    if (amountError) newErrors.amount = amountError;

    if (!providerDetails) {
      newErrors.provider = 'Invalid payment provider';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validatePhoneNumber, validateAmount, providerDetails]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Call onSubmit prop if provided
      if (onSubmit) {
        onSubmit(formData);
      }

      // Submit to API
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fee: calculateFee(formData.amount),
          totalAmount: formData.amount + calculateFee(formData.amount),
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment initiation failed');
      }

      const result: PaymentResponse = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.message || 'Payment failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, isSubmitting, disabled, calculateFee, onSubmit, onSuccess, onError]);

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      country,
      provider,
      phoneNumber: initialPhoneNumber,
      amount,
      currency,
      orderId
    }));
  }, [country, provider, initialPhoneNumber, amount, currency, orderId]);

  if (!providerDetails) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Provider Not Supported</h3>
            <p className="text-red-700 text-sm">
              {provider} is not available in {countryDetails?.name || country}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fee = calculateFee(formData.amount);
  const totalAmount = formData.amount + fee;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <Image
                src={providerDetails.logo}
                alt={providerDetails.name}
                fill
                className="object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/providers/default-provider.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {providerDetails.name}
              </h2>
              <p className="text-sm text-gray-600">
                {countryDetails?.name || country} • {providerDetails.ussdCode}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    ~{providerDetails.processingTime}min
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Fee: {providerDetails.feeStructure.percentage}%
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Payment Instructions"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Payment Steps:</h4>
            <ol className="space-y-2 text-sm text-blue-800">
              {providerDetails.instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">Payment Error</p>
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder={`Enter your ${providerDetails.shortName} phone number`}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.phoneNumber
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              disabled={disabled || isSubmitting}
              required
            />
            {!errors.phoneNumber && formData.phoneNumber && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Format: {formatPhoneNumber('0701234567', country)}
          </p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min={providerDetails.minAmount}
              max={providerDetails.maxAmount}
              step="0.01"
              className={`w-full pl-10 pr-20 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.amount
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              disabled={disabled || isSubmitting}
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">{currency}</span>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
          <div className="mt-1 text-xs text-gray-500 space-y-1">
            <p>Min: {providerDetails.feeStructure.currency} {providerDetails.minAmount.toLocaleString()}</p>
            <p>Max: {providerDetails.feeStructure.currency} {providerDetails.maxAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Amount Breakdown */}
        {formData.amount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="text-gray-900">{currency} {formData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="text-gray-900">{currency} {fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-medium">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{currency} {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={disabled || isSubmitting || !validateForm()}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Pay {currency} {totalAmount.toFixed(2)}</span>
              </div>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Secure Payment</p>
            <p>Your payment is secured with end-to-end encryption. Your phone number will only be used for this transaction.</p>
          </div>
        </div>
      </form>
    </div>
  );
}; 