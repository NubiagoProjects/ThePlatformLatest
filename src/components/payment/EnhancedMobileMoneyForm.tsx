/**
 * Enhanced Mobile Money Payment Form
 * Dynamic country/provider selection with real-time validation
 * Improved UX with provider logos, instructions, and error handling
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
  Clock,
  Globe,
  MapPin,
  Zap
} from 'lucide-react';
import { PaymentErrorUI, PaymentInstructionsFallback } from './PaymentErrorUI';

interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  providers: MobileMoneyProvider[];
}

interface MobileMoneyProvider {
  id: string;
  name: string;
  logo: string;
  ussd_code: string;
  phone_pattern: string;
  min_amount: number;
  max_amount: number;
  fee_percentage: number;
  countries: string[];
}

interface EnhancedMobileMoneyFormProps {
  initialCountry?: string;
  initialProvider?: string;
  amount: number;
  currency?: string;
  orderId?: string;
  onSubmit?: (data: PaymentFormData) => void;
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: PaymentError) => void;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
  showCountrySelector?: boolean;
  autoDetectLocation?: boolean;
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
  paymentId: string;
  reference: string;
  status: string;
  redirectUrl?: string;
}

interface PaymentError {
  type: 'timeout' | 'failed' | 'network' | 'validation' | 'provider_error';
  message: string;
  code?: string;
  retryable?: boolean;
}

// Mock data - in real app, fetch from API
const COUNTRIES: Country[] = [
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    providers: [
      {
        id: 'mpesa-ke',
        name: 'M-Pesa',
        logo: '/images/providers/mpesa.png',
        ussd_code: '*334#',
        phone_pattern: '^254[0-9]{9}$',
        min_amount: 10,
        max_amount: 150000,
        fee_percentage: 1.5,
        countries: ['KE']
      },
      {
        id: 'airtel-ke',
        name: 'Airtel Money',
        logo: '/images/providers/airtel.png',
        ussd_code: '*185#',
        phone_pattern: '^254[0-9]{9}$',
        min_amount: 10,
        max_amount: 100000,
        fee_percentage: 2.0,
        countries: ['KE']
      }
    ]
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    providers: [
      {
        id: 'opay-ng',
        name: 'OPay',
        logo: '/images/providers/opay.png',
        ussd_code: '*955#',
        phone_pattern: '^234[0-9]{10}$',
        min_amount: 100,
        max_amount: 500000,
        fee_percentage: 1.0,
        countries: ['NG']
      }
    ]
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    providers: [
      {
        id: 'mtn-ug',
        name: 'MTN MoMo',
        logo: '/images/providers/mtn.png',
        ussd_code: '*170#',
        phone_pattern: '^256[0-9]{9}$',
        min_amount: 1000,
        max_amount: 2000000,
        fee_percentage: 2.5,
        countries: ['UG']
      },
      {
        id: 'airtel-ug',
        name: 'Airtel Money',
        logo: '/images/providers/airtel.png',
        ussd_code: '*185#',
        phone_pattern: '^256[0-9]{9}$',
        min_amount: 1000,
        max_amount: 1500000,
        fee_percentage: 2.0,
        countries: ['UG']
      }
    ]
  }
];

export default function EnhancedMobileMoneyForm({
  initialCountry = '',
  initialProvider = '',
  amount,
  currency = 'USD',
  orderId,
  onSubmit,
  onSuccess,
  onError,
  onCancel,
  className = '',
  disabled = false,
  showCountrySelector = true,
  autoDetectLocation = true
}: EnhancedMobileMoneyFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showInstructions, setShowInstructions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [autoDetectedCountry, setAutoDetectedCountry] = useState<string>('');

  // Auto-detect user location
  const detectUserLocation = useCallback(async () => {
    if (!autoDetectLocation) return;

    try {
      // Use the GeoIP service we created
      const response = await fetch('/api/location/detect');
      const data = await response.json();
      
      if (data.success && data.country) {
        setAutoDetectedCountry(data.country);
        const country = COUNTRIES.find(c => c.code === data.country);
        if (country && !selectedCountry) {
          setSelectedCountry(country);
          if (country.providers.length === 1) {
            setSelectedProvider(country.providers[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  }, [autoDetectLocation, selectedCountry]);

  // Initialize form
  useEffect(() => {
    // Set initial country if provided
    if (initialCountry) {
      const country = COUNTRIES.find(c => c.code === initialCountry);
      if (country) {
        setSelectedCountry(country);
        
        // Set initial provider if provided
        if (initialProvider) {
          const provider = country.providers.find(p => p.id === initialProvider);
          if (provider) {
            setSelectedProvider(provider);
          }
        }
      }
    } else {
      detectUserLocation();
    }
  }, [initialCountry, initialProvider, detectUserLocation]);

  // Validate phone number
  const validatePhoneNumber = (phone: string, provider: MobileMoneyProvider | null) => {
    if (!phone) return 'Phone number is required';
    if (!provider) return 'Please select a provider';
    
    const pattern = new RegExp(provider.phone_pattern);
    if (!pattern.test(phone)) {
      return `Invalid phone number format for ${provider.name}`;
    }
    
    return '';
  };

  // Validate amount
  const validateAmount = (amt: number, provider: MobileMoneyProvider | null) => {
    if (!provider) return '';
    
    if (amt < provider.min_amount) {
      return `Minimum amount is ${provider.min_amount} ${selectedCountry?.currency}`;
    }
    if (amt > provider.max_amount) {
      return `Maximum amount is ${provider.max_amount} ${selectedCountry?.currency}`;
    }
    
    return '';
  };

  // Calculate fees
  const calculateFees = () => {
    if (!selectedProvider || !amount) return { fee: 0, total: amount };
    
    const fee = (amount * selectedProvider.fee_percentage) / 100;
    return { fee, total: amount + fee };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCountry || !selectedProvider || !phoneNumber) {
      setError({
        type: 'validation',
        message: 'Please fill in all required fields',
        retryable: false
      });
      return;
    }

    // Validate inputs
    const phoneError = validatePhoneNumber(phoneNumber, selectedProvider);
    const amountError = validateAmount(amount, selectedProvider);
    
    const errors: Record<string, string> = {};
    if (phoneError) errors.phone = phoneError;
    if (amountError) errors.amount = amountError;
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);
    setError(null);

    try {
      const formData: PaymentFormData = {
        country: selectedCountry.code,
        provider: selectedProvider,
        phoneNumber,
        amount,
        currency,
        orderId
      };

      // Call custom submit handler if provided
      if (onSubmit) {
        onSubmit(formData);
        return;
      }

      // Default API call
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      const error: PaymentError = {
        type: err instanceof Error && err.message.includes('timeout') ? 'timeout' : 'failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        retryable: true
      };
      
      setError(error);
      setRetryCount(prev => prev + 1);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    handleSubmit(new Event('submit') as any);
  };

  // If there's a non-validation error, show error UI
  if (error && error.type !== 'validation') {
    return (
      <PaymentErrorUI
        errorType={error.type}
        onRetry={error.retryable ? handleRetry : undefined}
        onCancel={onCancel}
        retryCount={retryCount}
        maxRetries={3}
        paymentDetails={selectedProvider ? {
          amount,
          currency: selectedCountry?.currency || currency,
          provider: selectedProvider.name,
          phone: phoneNumber
        } : undefined}
        customMessage={error.message}
        showInstructions={showInstructions}
      />
    );
  }

  const fees = calculateFees();

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Mobile Money Payment</h2>
              <p className="text-blue-100 text-sm">Fast & secure mobile payments</p>
            </div>
          </div>
          {autoDetectedCountry && (
            <div className="text-right">
              <div className="flex items-center text-blue-100 text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                Auto-detected location
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Country Selection */}
        {showCountrySelector && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Country
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(country);
                    setSelectedProvider(null);
                    setValidationErrors({});
                  }}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    selectedCountry?.code === country.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="font-medium text-gray-900">{country.name}</p>
                      <p className="text-sm text-gray-500">{country.currency}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provider Selection */}
        {selectedCountry && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Mobile Money Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedCountry.providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setValidationErrors({});
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedProvider?.id === provider.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {/* In real app, use actual provider logos */}
                      <Smartphone className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{provider.name}</p>
                      <p className="text-sm text-gray-500">USSD: {provider.ussd_code}</p>
                      <p className="text-xs text-gray-400">Fee: {provider.fee_percentage}%</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phone Number */}
        {selectedProvider && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setValidationErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder={`Enter your ${selectedProvider.name} number`}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={disabled || isLoading}
              />
              {validationErrors.phone && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            {validationErrors.phone && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Format: {selectedProvider.name} registered number
            </p>
          </div>
        )}

        {/* Amount Display */}
        {selectedProvider && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">{selectedCountry.currency} {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Fee ({selectedProvider.fee_percentage}%)</span>
                <span className="font-medium">{selectedCountry.currency} {fees.fee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{selectedCountry.currency} {fees.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {validationErrors.amount && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {validationErrors.amount}
              </div>
            )}
          </div>
        )}

        {/* Provider Limits */}
        {selectedProvider && (
          <div className="text-xs text-gray-500">
            <p>Limits: {selectedCountry.currency} {selectedProvider.min_amount.toLocaleString()} - {selectedProvider.max_amount.toLocaleString()}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={!selectedCountry || !selectedProvider || !phoneNumber || disabled || isLoading}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Pay {selectedCountry?.currency} {fees.total.toFixed(2)}
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Instructions Toggle */}
        {selectedProvider && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showInstructions ? 'Hide' : 'Show'} payment instructions
            </button>
          </div>
        )}

        {/* Instructions */}
        {showInstructions && selectedProvider && (
          <PaymentInstructionsFallback
            provider={selectedProvider.name}
            amount={fees.total}
            currency={selectedCountry.currency}
            phone={phoneNumber}
            ussdCode={selectedProvider.ussd_code}
            onCompleted={() => setShowInstructions(false)}
          />
        )}

        {/* Security Notice */}
        <div className="flex items-start space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <Shield className="w-4 h-4 text-green-600 mt-0.5" />
          <p>
            Your payment is secured with bank-level encryption. 
            You will receive SMS confirmation once payment is completed.
          </p>
        </div>
      </form>
    </div>
  );
} 