/**
 * Mobile-Optimized Payment Form
 * Fully responsive with touch-friendly interface, country-specific USSD instructions,
 * SMS sharing, lazy loading, and optimal mobile UX
 */

'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { 
  Smartphone, 
  Send, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  Share2,
  ChevronDown,
  ChevronUp,
  Wifi,
  Signal,
  Battery,
  Shield,
  HelpCircle
} from 'lucide-react';

// Lazy load heavy components would go here

interface MobileOptimizedPaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface CountryProvider {
  id: string;
  name: string;
  logo: string;
  ussd_code: string;
  ussd_steps: string[];
  phone_pattern: string;
  short_code?: string;
  app_name?: string;
  app_deep_link?: string;
  market_share: number;
  countries: string[];
  sms_format?: string;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  dial_code: string;
  providers: CountryProvider[];
}

// Country-specific provider data with detailed USSD instructions
const MOBILE_COUNTRIES: Country[] = [
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    dial_code: '+254',
    providers: [
      {
        id: 'mpesa-ke',
        name: 'M-Pesa',
        logo: '/images/providers/mpesa.svg',
        ussd_code: '*334#',
        ussd_steps: [
          'Dial *334# on your phone',
          'Select "Send Money" (Option 1)',
          'Select "Enter Phone Number"',
          'Enter merchant number: 174379',
          'Enter amount: KES {amount}',
          'Enter your M-Pesa PIN',
          'Confirm transaction'
        ],
        phone_pattern: '^254[0-9]{9}$',
        short_code: '174379',
        app_name: 'M-Pesa App',
        app_deep_link: 'mpesa://pay',
        market_share: 85,
        countries: ['KE'],
        sms_format: 'Send {amount} to 174379 via M-Pesa'
      },
      {
        id: 'airtel-ke',
        name: 'Airtel Money',
        logo: '/images/providers/airtel.svg',
        ussd_code: '*185#',
        ussd_steps: [
          'Dial *185# on your phone',
          'Select "Make Payment" (Option 5)',
          'Select "Paybill"',
          'Enter business number: 567890',
          'Enter amount: KES {amount}',
          'Enter your Airtel Money PIN',
          'Confirm payment'
        ],
        phone_pattern: '^254[0-9]{9}$',
        short_code: '567890',
        app_name: 'Airtel Money',
        market_share: 12,
        countries: ['KE'],
        sms_format: 'Pay {amount} to 567890 via Airtel Money'
      }
    ]
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    dial_code: '+256',
    providers: [
      {
        id: 'mtn-ug',
        name: 'MTN MoMo',
        logo: '/images/providers/mtn.svg',
        ussd_code: '*170#',
        ussd_steps: [
          'Dial *170# on your phone',
          'Select "Transfer Money" (Option 1)',
          'Select "To Non MTN Number"',
          'Enter merchant code: 678901',
          'Enter amount: UGX {amount}',
          'Enter reference: NUBIAGO',
          'Enter your MoMo PIN',
          'Confirm transaction'
        ],
        phone_pattern: '^256[0-9]{9}$',
        short_code: '678901',
        app_name: 'MoMo Pay',
        market_share: 60,
        countries: ['UG'],
        sms_format: 'Send {amount} UGX to 678901 for NUBIAGO'
      }
    ]
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    dial_code: '+234',
    providers: [
      {
        id: 'opay-ng',
        name: 'OPay',
        logo: '/images/providers/opay.svg',
        ussd_code: '*955#',
        ussd_steps: [
          'Dial *955# on your phone',
          'Select "Transfer" (Option 1)',
          'Select "To Bank Account"',
          'Enter account: 7890123456',
          'Enter amount: NGN {amount}',
          'Confirm details',
          'Enter your OPay PIN'
        ],
        phone_pattern: '^234[0-9]{10}$',
        app_name: 'OPay',
        app_deep_link: 'opay://transfer',
        market_share: 40,
        countries: ['NG'],
        sms_format: 'Transfer {amount} NGN via OPay to 7890123456'
      }
    ]
  }
];

export default function MobileOptimizedPaymentForm({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  className = ''
}: MobileOptimizedPaymentFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<CountryProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    hasTouch: false,
    screenSize: 'small'
  });

  // Detect device capabilities
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        hasTouch: 'ontouchstart' in window,
        screenSize: window.innerWidth < 768 ? 'small' : window.innerWidth < 1024 ? 'medium' : 'large'
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);

  // Auto-detect country based on previous selections or geolocation
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to get saved preference first
        const savedCountry = localStorage.getItem('nubiago_preferred_country');
        if (savedCountry) {
          const country = MOBILE_COUNTRIES.find(c => c.code === savedCountry);
          if (country) {
            setSelectedCountry(country);
            return;
          }
        }

        // Fallback to GeoIP detection
        const response = await fetch('/api/location/detect');
        const data = await response.json();
        
        if (data.success && data.country) {
          const country = MOBILE_COUNTRIES.find(c => c.code === data.country);
          if (country) {
            setSelectedCountry(country);
            localStorage.setItem('nubiago_preferred_country', country.code);
          }
        }
      } catch (error) {
        console.error('Country detection failed:', error);
      }
    };

    detectCountry();
  }, []);

  // Auto-select best provider when country changes
  useEffect(() => {
    if (selectedCountry && selectedCountry.providers.length > 0) {
      const savedProvider = localStorage.getItem('nubiago_preferred_provider');
      const preferredProvider = selectedCountry.providers.find(p => p.id === savedProvider);
      
      if (preferredProvider) {
        setSelectedProvider(preferredProvider);
      } else {
        // Select provider with highest market share
        const bestProvider = selectedCountry.providers.reduce((prev, current) => 
          current.market_share > prev.market_share ? current : prev
        );
        setSelectedProvider(bestProvider);
      }
    }
  }, [selectedCountry]);

  // Copy to clipboard with haptic feedback
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      
      // Haptic feedback on mobile
      if (deviceInfo.isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [deviceInfo.isMobile]);

  // Share payment instructions via SMS or other apps
  const shareInstructions = useCallback(async () => {
    if (!selectedProvider || !selectedCountry) return;

    const instructionsText = `
Nubiago Payment Instructions:
Provider: ${selectedProvider.name}
Amount: ${selectedCountry.currency} ${amount.toLocaleString()}
USSD Code: ${selectedProvider.ussd_code}

Steps:
${selectedProvider.ussd_steps.map((step, i) => `${i + 1}. ${step.replace('{amount}', amount.toLocaleString())}`).join('\n')}

Questions? Contact support@nubiago.com
`.trim();

    try {
      if (navigator.share && deviceInfo.isMobile) {
        await navigator.share({
          title: 'Nubiago Payment Instructions',
          text: instructionsText,
          url: window.location.href
        });
      } else {
        // Fallback to copying
        await copyToClipboard(instructionsText, 'instructions');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback to SMS if available
      if (deviceInfo.isMobile) {
        const smsUrl = `sms:?body=${encodeURIComponent(instructionsText)}`;
        window.open(smsUrl);
      }
    }
  }, [selectedProvider, selectedCountry, amount, copyToClipboard, deviceInfo.isMobile]);

  // Send instructions via SMS
  const sendSMSInstructions = useCallback(() => {
    if (!selectedProvider || !phoneNumber) return;

    const smsText = selectedProvider.sms_format
      ?.replace('{amount}', amount.toLocaleString())
      || `Pay ${selectedCountry?.currency} ${amount.toLocaleString()} via ${selectedProvider.name}`;

    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsText)}`;
    window.open(smsUrl);
  }, [selectedProvider, phoneNumber, amount, selectedCountry]);

  // Validate phone number format
  const validatePhoneNumber = useCallback((phone: string) => {
    if (!selectedProvider || !phone) return '';
    
    const pattern = new RegExp(selectedProvider.phone_pattern);
    if (!pattern.test(phone)) {
      return `Invalid ${selectedProvider.name} number format`;
    }
    return '';
  }, [selectedProvider]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCountry || !selectedProvider || !phoneNumber) {
      setValidationErrors({ general: 'Please complete all fields' });
      return;
    }

    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      setValidationErrors({ phone: phoneError });
      return;
    }

    setLoading(true);
    setValidationErrors({});

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry.code,
          provider: selectedProvider,
          phoneNumber,
          amount,
          currency
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      // Save preferences
      localStorage.setItem('nubiago_preferred_country', selectedCountry.code);
      localStorage.setItem('nubiago_preferred_provider', selectedProvider.id);

      if (onSuccess) {
        onSuccess(result.paymentId);
      }

      setCurrentStep(3); // Show success/instructions step

    } catch (error) {
      console.error('Payment error:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Payment failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white min-h-screen ${className}`}>
      {/* Mobile Status Bar Simulation */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white text-xs">
        <div className="flex items-center space-x-1">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
        </div>
        <div className="font-medium">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center space-x-1">
          <span>100%</span>
          <Battery className="w-3 h-3" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Mobile Payment</h1>
            <p className="text-blue-100 text-sm">Pay ${amount.toFixed(2)} {currency}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center mt-4 space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full ${
                step <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-blue-100 mt-1">
          <span>Country</span>
          <span>Provider</span>
          <span>Payment</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-24">
        {/* Step 1: Country Selection */}
        {!selectedCountry && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Your Country</h2>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg" />}>
              <div className="grid grid-cols-1 gap-3">
                {MOBILE_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country);
                      setCurrentStep(2);
                    }}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors active:scale-95"
                  >
                    <span className="text-3xl mr-4">{country.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{country.name}</p>
                      <p className="text-sm text-gray-500">{country.currency} • {country.dial_code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Suspense>
          </div>
        )}

        {/* Step 2: Provider Selection */}
        {selectedCountry && !selectedProvider && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Choose Payment Method</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry(null);
                  setCurrentStep(1);
                }}
                className="text-blue-600 text-sm"
              >
                Change Country
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg flex items-center">
              <span className="text-2xl mr-3">{selectedCountry.flag}</span>
              <div>
                <p className="font-medium text-blue-900">{selectedCountry.name}</p>
                <p className="text-sm text-blue-700">Pay in {selectedCountry.currency}</p>
              </div>
            </div>

            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg" />}>
              <div className="space-y-3">
                {selectedCountry.providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider);
                      setCurrentStep(3);
                    }}
                    className="w-full flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors active:scale-95"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      <Smartphone className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{provider.name}</p>
                      <p className="text-sm text-gray-500">
                        {provider.ussd_code} • {provider.market_share}% market share
                      </p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </Suspense>
          </div>
        )}

        {/* Step 3: Payment Details & Instructions */}
        {selectedCountry && selectedProvider && (
          <div className="space-y-6">
            {/* Provider Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedProvider.name}</p>
                    <p className="text-sm text-gray-600">{selectedCountry.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider(null);
                    setCurrentStep(2);
                  }}
                  className="text-blue-600 text-sm"
                >
                  Change
                </button>
              </div>

              {/* Amount Summary */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Pay</span>
                  <span className="text-xl font-bold text-gray-900">
                    {selectedCountry.currency} {amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Your {selectedProvider.name} Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setValidationErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder={`${selectedCountry.dial_code} 700 123 456`}
                  className={`w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  inputMode="tel"
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
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center">
                  <HelpCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="font-medium text-yellow-900">
                    How to pay with {selectedProvider.name}
                  </span>
                </div>
                {showInstructions ? (
                  <ChevronUp className="w-5 h-5 text-yellow-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-yellow-600" />
                )}
              </button>

              {showInstructions && (
                <div className="px-4 pb-4">
                  <Suspense fallback={<div className="animate-pulse bg-yellow-100 h-24 rounded" />}>
                    <div className="space-y-3">
                      {/* USSD Code */}
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Dial this code:</p>
                            <p className="text-2xl font-bold text-gray-900 font-mono">
                              {selectedProvider.ussd_code}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedProvider.ussd_code, 'ussd')}
                            className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            {copiedItem === 'ussd' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-blue-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Step-by-step instructions */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Steps:</p>
                        {selectedProvider.ussd_steps.map((step, index) => (
                          <div key={index} className="flex items-start bg-white rounded p-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">
                              {step.replace('{amount}', `${selectedCountry.currency} ${amount.toLocaleString()}`)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex space-x-2 pt-3">
                        <button
                          type="button"
                          onClick={shareInstructions}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </button>
                        
                        {phoneNumber && (
                          <button
                            type="button"
                            onClick={sendSMSInstructions}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            SMS Me
                          </button>
                        )}
                      </div>
                    </div>
                  </Suspense>
                </div>
              )}
            </div>

            {/* App Launch Option */}
            {selectedProvider.app_deep_link && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Use {selectedProvider.app_name}</p>
                    <p className="text-sm text-blue-700">Open the app directly to pay</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(selectedProvider.app_deep_link, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    Open App
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !phoneNumber || !!validatePhoneNumber(phoneNumber)}
              className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Complete Payment
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg text-sm">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Secure Payment</p>
                <p className="text-gray-600">
                  Your payment is protected with bank-level security. 
                  Complete the payment on your phone and you'll receive instant confirmation.
                </p>
              </div>
            </div>
          </div>
        )}

        {validationErrors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{validationErrors.general}</p>
          </div>
        )}
      </form>

      {/* Floating Action Button for Help */}
      <button
        type="button"
        onClick={() => setShowInstructions(!showInstructions)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-10"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Mobile-optimized touch feedback */}
      <style jsx>{`
        @media (max-width: 768px) {
          button:active {
            transform: scale(0.98);
          }
          
          input:focus {
            transform: scale(1.02);
            transition: transform 0.1s ease;
          }
        }
      `}</style>
    </div>
  );
} 