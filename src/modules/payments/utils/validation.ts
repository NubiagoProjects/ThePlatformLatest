/**
 * Mobile Money Payment Validation Utilities
 * Phone number validation, provider compatibility, and amount limits
 */

import { MOBILE_MONEY_PROVIDERS, AFRICAN_COUNTRIES } from '../constants/countries';
import type { MobileMoneyProvider } from '../types';

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
  country?: string;
  provider?: MobileMoneyProvider;
}

export interface AmountValidationResult {
  isValid: boolean;
  error?: string;
  fee?: number;
  total?: number;
}

/**
 * Phone number validation patterns by country and provider
 */
export const PHONE_PATTERNS: Record<string, Record<string, RegExp>> = {
  'NG': {
    'MTN_MOMO': /^(\+234|234|0)?[789][01]\d{8}$/,
    'ALL': /^(\+234|234|0)?[789][01]\d{8}$/,
  },
  'KE': {
    'MPESA': /^(\+254|254|0)?[17]\d{8}$/,
    'ALL': /^(\+254|254|0)?[17]\d{8}$/,
  },
  'UG': {
    'MTN_MOMO': /^(\+256|256|0)?[37]\d{8}$/,
    'ALL': /^(\+256|256|0)?[37]\d{8}$/,
  },
  'GH': {
    'MTN_MOMO': /^(\+233|233|0)?[235]\d{8}$/,
    'VODAFONE_CASH': /^(\+233|233|0)?[235]\d{8}$/,
    'ALL': /^(\+233|233|0)?[235]\d{8}$/,
  },
  'TZ': {
    'TIGO_CASH': /^(\+255|255|0)?[67]\d{8}$/,
    'AIRTEL_MONEY': /^(\+255|255|0)?[67]\d{8}$/,
    'ALL': /^(\+255|255|0)?[67]\d{8}$/,
  },
  'ZA': {
    'MTN_MOMO': /^(\+27|27|0)?[67]\d{8}$/,
    'ALL': /^(\+27|27|0)?[67]\d{8}$/,
  },
  'SN': {
    'ORANGE_MONEY': /^(\+221|221|0)?[37]\d{8}$/,
    'WAVE': /^(\+221|221|0)?[37]\d{8}$/,
    'ALL': /^(\+221|221|0)?[37]\d{8}$/,
  },
  'BF': {
    'MOOV_MONEY': /^(\+226|226|0)?[67]\d{7}$/,
    'ALL': /^(\+226|226|0)?[67]\d{7}$/,
  },
  'TG': {
    'FLOOZ': /^(\+228|228|0)?[92]\d{7}$/,
    'ALL': /^(\+228|228|0)?[92]\d{7}$/,
  },
  'CI': {
    'MTN_MOMO': /^(\+225|225|0)?[0457]\d{7}$/,
    'ORANGE_MONEY': /^(\+225|225|0)?[0457]\d{7}$/,
    'ALL': /^(\+225|225|0)?[0457]\d{7}$/,
  },
  'CM': {
    'MTN_MOMO': /^(\+237|237|0)?[62]\d{8}$/,
    'ORANGE_MONEY': /^(\+237|237|0)?[62]\d{8}$/,
    'ALL': /^(\+237|237|0)?[62]\d{8}$/,
  }
};

/**
 * Phone number formatting patterns by country
 */
export const PHONE_FORMATS: Record<string, (phone: string) => string> = {
  'NG': (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    let num = cleaned;
    if (num.startsWith('234')) num = num.slice(3);
    if (num.startsWith('0')) num = num.slice(1);
    if (num.length === 10) {
      return `+234 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return phone;
  },
  'KE': (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    let num = cleaned;
    if (num.startsWith('254')) num = num.slice(3);
    if (num.startsWith('0')) num = num.slice(1);
    if (num.length === 9) {
      return `+254 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return phone;
  },
  'UG': (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    let num = cleaned;
    if (num.startsWith('256')) num = num.slice(3);
    if (num.startsWith('0')) num = num.slice(1);
    if (num.length === 9) {
      return `+256 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return phone;
  },
  'GH': (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    let num = cleaned;
    if (num.startsWith('233')) num = num.slice(3);
    if (num.startsWith('0')) num = num.slice(1);
    if (num.length === 9) {
      return `+233 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return phone;
  },
  'TZ': (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    let num = cleaned;
    if (num.startsWith('255')) num = num.slice(3);
    if (num.startsWith('0')) num = num.slice(1);
    if (num.length === 9) {
      return `+255 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return phone;
  }
};

/**
 * Provider-specific phone number prefixes
 */
export const PROVIDER_PREFIXES: Record<string, Record<MobileMoneyProvider, string[]>> = {
  'NG': {
    'MTN_MOMO': ['803', '806', '813', '814', '816', '903', '906', '913'],
    'VODAFONE_CASH': [],
    'TIGO_CASH': [],
    'AIRTEL_MONEY': ['802', '808', '812', '901', '902', '907', '911'],
    'MPESA': [],
    'ORANGE_MONEY': [],
    'MOOV_MONEY': [],
    'WAVE': [],
    'FLOOZ': []
  },
  'KE': {
    'MPESA': ['700', '701', '702', '703', '704', '705', '706', '707', '708', '709'],
    'MTN_MOMO': [],
    'VODAFONE_CASH': [],
    'TIGO_CASH': [],
    'AIRTEL_MONEY': ['730', '731', '732', '733', '734', '735', '736', '737', '738', '739'],
    'ORANGE_MONEY': [],
    'MOOV_MONEY': [],
    'WAVE': [],
    'FLOOZ': []
  }
};

/**
 * Validate phone number for mobile money provider
 */
export const validatePhoneNumber = (
  phoneNumber: string, 
  country: string, 
  provider: MobileMoneyProvider
): PhoneValidationResult => {
  // Basic validation
  if (!phoneNumber || !phoneNumber.trim()) {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  
  // Get validation pattern
  const countryPatterns = PHONE_PATTERNS[country.toUpperCase()];
  if (!countryPatterns) {
    return {
      isValid: false,
      error: `Phone validation not supported for ${country}`
    };
  }

  // Check provider-specific pattern first, then general country pattern
  const providerPattern = countryPatterns[provider];
  const generalPattern = countryPatterns['ALL'];
  const pattern = providerPattern || generalPattern;

  if (!pattern) {
    return {
      isValid: false,
      error: `${provider} is not supported in ${country}`
    };
  }

  // Validate against pattern
  if (!pattern.test(cleanPhone)) {
    const providerDetails = MOBILE_MONEY_PROVIDERS[provider];
    return {
      isValid: false,
      error: `Invalid phone number format for ${providerDetails?.name || provider}`
    };
  }

  // Check provider prefix compatibility (if available)
  const countryPrefixes = PROVIDER_PREFIXES[country.toUpperCase()];
  if (countryPrefixes && countryPrefixes[provider]) {
    const prefixes = countryPrefixes[provider];
    if (prefixes.length > 0) {
      const phoneDigits = cleanPhone.replace(/^\+?\d{1,3}/, ''); // Remove country code
      const phonePrefix = phoneDigits.slice(0, 3);
      
      if (!prefixes.includes(phonePrefix)) {
        const providerDetails = MOBILE_MONEY_PROVIDERS[provider];
        return {
          isValid: false,
          error: `This phone number is not compatible with ${providerDetails?.name || provider}`
        };
      }
    }
  }

  // Format phone number
  const formatter = PHONE_FORMATS[country.toUpperCase()];
  const formatted = formatter ? formatter(cleanPhone) : cleanPhone;

  return {
    isValid: true,
    formatted,
    country,
    provider
  };
};

/**
 * Validate amount for mobile money provider
 */
export const validateAmount = (
  amount: number,
  provider: MobileMoneyProvider,
  currency: string = 'USD'
): AmountValidationResult => {
  if (!amount || amount <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0'
    };
  }

  const providerDetails = MOBILE_MONEY_PROVIDERS[provider];
  if (!providerDetails) {
    return {
      isValid: false,
      error: 'Invalid payment provider'
    };
  }

  // Check minimum amount
  if (amount < providerDetails.minAmount) {
    return {
      isValid: false,
      error: `Minimum amount is ${providerDetails.feeStructure.currency} ${providerDetails.minAmount.toLocaleString()}`
    };
  }

  // Check maximum amount
  if (amount > providerDetails.maxAmount) {
    return {
      isValid: false,
      error: `Maximum amount is ${providerDetails.feeStructure.currency} ${providerDetails.maxAmount.toLocaleString()}`
    };
  }

  // Calculate fees
  const { percentage, fixed } = providerDetails.feeStructure;
  const fee = (amount * percentage / 100) + fixed;
  const total = amount + fee;

  return {
    isValid: true,
    fee,
    total
  };
};

/**
 * Check if provider is available in country
 */
export const isProviderAvailableInCountry = (
  provider: MobileMoneyProvider,
  country: string
): boolean => {
  const providerDetails = MOBILE_MONEY_PROVIDERS[provider];
  if (!providerDetails) return false;
  
  return providerDetails.countries.includes(country.toUpperCase());
};

/**
 * Get available providers for country
 */
export const getAvailableProvidersForCountry = (country: string): MobileMoneyProvider[] => {
  const countryCode = country.toUpperCase();
  const providers: MobileMoneyProvider[] = [];
  
  Object.entries(MOBILE_MONEY_PROVIDERS).forEach(([providerCode, details]) => {
    if (details.countries.includes(countryCode)) {
      providers.push(providerCode as MobileMoneyProvider);
    }
  });
  
  return providers;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Clean and normalize phone number
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Get country code from phone number
 */
export const getCountryFromPhoneNumber = (phone: string): string | null => {
  const cleaned = cleanPhoneNumber(phone);
  
  const countryCodes: Record<string, string> = {
    '234': 'NG',
    '254': 'KE', 
    '256': 'UG',
    '233': 'GH',
    '255': 'TZ',
    '27': 'ZA',
    '221': 'SN',
    '226': 'BF',
    '228': 'TG',
    '225': 'CI',
    '237': 'CM'
  };

  for (const [code, country] of Object.entries(countryCodes)) {
    if (cleaned.startsWith(code)) {
      return country;
    }
  }

  return null;
};

/**
 * Validate complete payment form data
 */
export interface PaymentFormValidation {
  isValid: boolean;
  errors: {
    phoneNumber?: string;
    amount?: string;
    provider?: string;
    country?: string;
  };
  formatted?: {
    phoneNumber?: string;
    amount?: number;
    total?: number;
    fee?: number;
  };
}

export const validatePaymentForm = (
  phoneNumber: string,
  amount: number,
  provider: MobileMoneyProvider,
  country: string,
  currency: string = 'USD'
): PaymentFormValidation => {
  const errors: PaymentFormValidation['errors'] = {};
  let formatted: PaymentFormValidation['formatted'] = {};

  // Validate phone number
  const phoneValidation = validatePhoneNumber(phoneNumber, country, provider);
  if (!phoneValidation.isValid) {
    errors.phoneNumber = phoneValidation.error;
  } else {
    formatted.phoneNumber = phoneValidation.formatted;
  }

  // Validate amount
  const amountValidation = validateAmount(amount, provider, currency);
  if (!amountValidation.isValid) {
    errors.amount = amountValidation.error;
  } else {
    formatted.amount = amount;
    formatted.fee = amountValidation.fee;
    formatted.total = amountValidation.total;
  }

  // Validate provider availability
  if (!isProviderAvailableInCountry(provider, country)) {
    const providerDetails = MOBILE_MONEY_PROVIDERS[provider];
    const countryDetails = AFRICAN_COUNTRIES.find(c => c.code === country.toUpperCase());
    errors.provider = `${providerDetails?.name || provider} is not available in ${countryDetails?.name || country}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    formatted: Object.keys(errors).length === 0 ? formatted : undefined
  };
}; 