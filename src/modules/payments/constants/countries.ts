/**
 * Country-specific Mobile Money Provider Configuration
 * Comprehensive data for African markets with Yellow Card integration
 */

import { Country, MobileMoneyProvider } from '../types';

// Mobile Money Provider Details
export const MOBILE_MONEY_PROVIDERS: Record<string, {
  code: MobileMoneyProvider;
  name: string;
  shortName: string;
  ussdCode: string;
  logo: string;
  color: string;
  processingTime: number; // in minutes
  minAmount: number;
  maxAmount: number;
  feeStructure: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  countries: string[];
  instructions: {
    steps: string[];
    tips: string[];
  };
}> = {
  MTN_MOMO: {
    code: 'MTN_MOMO',
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    ussdCode: '*165#',
    logo: '/images/providers/mtn-momo.png',
    color: '#FFCB00',
    processingTime: 5,
    minAmount: 100,
    maxAmount: 5000000,
    feeStructure: {
      percentage: 0.5,
      fixed: 0,
      currency: 'NGN'
    },
    countries: ['NG', 'UG', 'GH', 'CI', 'CM'],
    instructions: {
      steps: [
        'Dial *165# on your MTN phone',
        'Select "Send Money"',
        'Enter the payment code provided',
        'Enter the exact amount',
        'Confirm with your PIN'
      ],
      tips: [
        'Ensure you have sufficient balance',
        'Keep your PIN secure',
        'Transaction usually completes within 2-5 minutes'
      ]
    }
  },

  MPESA: {
    code: 'MPESA',
    name: 'M-Pesa',
    shortName: 'M-Pesa',
    ussdCode: '*334#',
    logo: '/images/providers/mpesa.png',
    color: '#00A651',
    processingTime: 3,
    minAmount: 50,
    maxAmount: 1000000,
    feeStructure: {
      percentage: 0.3,
      fixed: 0,
      currency: 'KES'
    },
    countries: ['KE', 'TZ'],
    instructions: {
      steps: [
        'Go to M-Pesa menu on your phone',
        'Select "Send Money"',
        'Enter business number provided',
        'Enter the amount',
        'Enter your M-Pesa PIN'
      ],
      tips: [
        'M-Pesa is the fastest option in Kenya',
        'Available 24/7',
        'Keep your transaction message for reference'
      ]
    }
  },

  AIRTEL_MONEY: {
    code: 'AIRTEL_MONEY',
    name: 'Airtel Money',
    shortName: 'Airtel Money',
    ussdCode: '*432#',
    logo: '/images/providers/airtel-money.png',
    color: '#E31E24',
    processingTime: 5,
    minAmount: 100,
    maxAmount: 2000000,
    feeStructure: {
      percentage: 0.4,
      fixed: 0,
      currency: 'NGN'
    },
    countries: ['NG', 'KE', 'UG', 'TZ', 'GH'],
    instructions: {
      steps: [
        'Dial *432# from your Airtel line',
        'Select "Send Money"',
        'Choose "To Business"',
        'Enter merchant code and amount',
        'Confirm with PIN'
      ],
      tips: [
        'Available across multiple African countries',
        'Low transaction fees',
        'Instant processing'
      ]
    }
  },

  VODAFONE_CASH: {
    code: 'VODAFONE_CASH',
    name: 'Vodafone Cash',
    shortName: 'Voda Cash',
    ussdCode: '*110#',
    logo: '/images/providers/vodafone-cash.png',
    color: '#E60000',
    processingTime: 5,
    minAmount: 50,
    maxAmount: 1500000,
    feeStructure: {
      percentage: 0.5,
      fixed: 0,
      currency: 'GHS'
    },
    countries: ['GH', 'TZ'],
    instructions: {
      steps: [
        'Dial *110# on your Vodafone phone',
        'Select "Transfer Money"',
        'Choose "To Business"',
        'Enter business code and amount',
        'Enter your Vodafone Cash PIN'
      ],
      tips: [
        'Popular in Ghana and Tanzania',
        'Reliable network coverage',
        'Competitive rates'
      ]
    }
  },

  TIGO_CASH: {
    code: 'TIGO_CASH',
    name: 'Tigo Cash',
    shortName: 'Tigo Cash',
    ussdCode: '*150*01#',
    logo: '/images/providers/tigo-cash.png',
    color: '#0085C3',
    processingTime: 7,
    minAmount: 1000,
    maxAmount: 3000000,
    feeStructure: {
      percentage: 0.6,
      fixed: 100,
      currency: 'TZS'
    },
    countries: ['TZ'],
    instructions: {
      steps: [
        'Dial *150*01# from your Tigo line',
        'Select "Send Money"',
        'Enter business number',
        'Enter amount and confirm',
        'Enter your PIN'
      ],
      tips: [
        'Strong presence in Tanzania',
        'Good for larger transactions',
        'Secure and reliable'
      ]
    }
  },

  ORANGE_MONEY: {
    code: 'ORANGE_MONEY',
    name: 'Orange Money',
    shortName: 'Orange Money',
    ussdCode: '#144#',
    logo: '/images/providers/orange-money.png',
    color: '#FF6900',
    processingTime: 5,
    minAmount: 100,
    maxAmount: 1000000,
    feeStructure: {
      percentage: 0.5,
      fixed: 0,
      currency: 'XOF'
    },
    countries: ['CI', 'SN', 'ML', 'BF'],
    instructions: {
      steps: [
        'Dial #144# from your Orange phone',
        'Select "Transfer"',
        'Choose "To Merchant"',
        'Enter merchant code and amount',
        'Confirm with your secret code'
      ],
      tips: [
        'Widely used in West Africa',
        'Support for multiple currencies',
        'Good customer service'
      ]
    }
  },

  MOOV_MONEY: {
    code: 'MOOV_MONEY',
    name: 'Moov Money',
    shortName: 'Moov Money',
    ussdCode: '*555#',
    logo: '/images/providers/moov-money.png',
    color: '#00B4A6',
    processingTime: 6,
    minAmount: 500,
    maxAmount: 2000000,
    feeStructure: {
      percentage: 0.7,
      fixed: 0,
      currency: 'XOF'
    },
    countries: ['CI', 'BF', 'TG'],
    instructions: {
      steps: [
        'Dial *555# on your Moov line',
        'Select "Money Transfer"',
        'Choose "Business Payment"',
        'Enter details and amount',
        'Confirm with PIN'
      ],
      tips: [
        'Popular in Francophone Africa',
        'Simple interface',
        'Quick processing'
      ]
    }
  },

  WAVE: {
    code: 'WAVE',
    name: 'Wave',
    shortName: 'Wave',
    ussdCode: '*145#',
    logo: '/images/providers/wave.png',
    color: '#3B82F6',
    processingTime: 3,
    minAmount: 100,
    maxAmount: 1000000,
    feeStructure: {
      percentage: 0.1,
      fixed: 0,
      currency: 'XOF'
    },
    countries: ['SN', 'CI', 'UG'],
    instructions: {
      steps: [
        'Open Wave app or dial *145#',
        'Select "Send Money"',
        'Enter merchant details',
        'Confirm amount',
        'Authorize with PIN or biometrics'
      ],
      tips: [
        'Lowest fees in the market',
        'Modern app interface',
        'Very fast processing'
      ]
    }
  },

  FLOOZ: {
    code: 'FLOOZ',
    name: 'Flooz',
    shortName: 'Flooz',
    ussdCode: '*155#',
    logo: '/images/providers/flooz.png',
    color: '#9333EA',
    processingTime: 5,
    minAmount: 200,
    maxAmount: 500000,
    feeStructure: {
      percentage: 0.8,
      fixed: 0,
      currency: 'XOF'
    },
    countries: ['SN', 'BJ'],
    instructions: {
      steps: [
        'Dial *155# from your phone',
        'Select "Payment"',
        'Enter merchant information',
        'Confirm transaction',
        'Enter your Flooz PIN'
      ],
      tips: [
        'Growing network in West Africa',
        'User-friendly interface',
        'Good for small transactions'
      ]
    }
  }
};

// Country Configuration
export const AFRICAN_COUNTRIES: Country[] = [
  {
    id: 'nigeria',
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    isSupported: true,
    mobileMoneyProviders: ['MTN_MOMO', 'AIRTEL_MONEY'],
    yellowCardSupported: true,
    flag: '🇳🇬',
    dialCode: '+234'
  },
  {
    id: 'kenya',
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    isSupported: true,
    mobileMoneyProviders: ['MPESA', 'AIRTEL_MONEY'],
    yellowCardSupported: true,
    flag: '🇰🇪',
    dialCode: '+254'
  },
  {
    id: 'uganda',
    code: 'UG',
    name: 'Uganda',
    currency: 'UGX',
    isSupported: true,
    mobileMoneyProviders: ['MTN_MOMO', 'AIRTEL_MONEY'],
    yellowCardSupported: true,
    flag: '🇺🇬',
    dialCode: '+256'
  },
  {
    id: 'tanzania',
    code: 'TZ',
    name: 'Tanzania',
    currency: 'TZS',
    isSupported: true,
    mobileMoneyProviders: ['VODAFONE_CASH', 'TIGO_CASH', 'AIRTEL_MONEY', 'MPESA'],
    yellowCardSupported: true,
    flag: '🇹🇿',
    dialCode: '+255'
  },
  {
    id: 'ghana',
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    isSupported: true,
    mobileMoneyProviders: ['MTN_MOMO', 'VODAFONE_CASH', 'AIRTEL_MONEY'],
    yellowCardSupported: true,
    flag: '🇬🇭',
    dialCode: '+233'
  },
  {
    id: 'south-africa',
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    isSupported: true,
    mobileMoneyProviders: [],
    yellowCardSupported: true,
    flag: '🇿🇦',
    dialCode: '+27'
  },
  {
    id: 'cote-divoire',
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    isSupported: false,
    mobileMoneyProviders: ['ORANGE_MONEY', 'MTN_MOMO', 'MOOV_MONEY', 'WAVE'],
    yellowCardSupported: false,
    flag: '🇨🇮',
    dialCode: '+225'
  },
  {
    id: 'senegal',
    code: 'SN',
    name: 'Senegal',
    currency: 'XOF',
    isSupported: false,
    mobileMoneyProviders: ['ORANGE_MONEY', 'WAVE', 'FLOOZ'],
    yellowCardSupported: false,
    flag: '🇸🇳',
    dialCode: '+221'
  }
];

// Currency Configuration
export const CURRENCY_CONFIG = {
  NGN: {
    name: 'Nigerian Naira',
    symbol: '₦',
    decimals: 2,
    minAmount: 100,
    maxAmount: 10000000,
    country: 'NG'
  },
  KES: {
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimals: 2,
    minAmount: 50,
    maxAmount: 2000000,
    country: 'KE'
  },
  UGX: {
    name: 'Ugandan Shilling',
    symbol: 'USh',
    decimals: 0,
    minAmount: 3000,
    maxAmount: 20000000,
    country: 'UG'
  },
  TZS: {
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    decimals: 0,
    minAmount: 2000,
    maxAmount: 15000000,
    country: 'TZ'
  },
  GHS: {
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    decimals: 2,
    minAmount: 10,
    maxAmount: 100000,
    country: 'GH'
  },
  ZAR: {
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    minAmount: 10,
    maxAmount: 500000,
    country: 'ZA'
  },
  XOF: {
    name: 'West African CFA Franc',
    symbol: 'CFA',
    decimals: 0,
    minAmount: 500,
    maxAmount: 5000000,
    country: 'CI'
  }
};

// Helper functions
export const getCountryByCode = (code: string): Country | null => {
  return AFRICAN_COUNTRIES.find(country => country.code === code) || null;
};

export const getCountriesByProvider = (provider: MobileMoneyProvider): Country[] => {
  const providerData = MOBILE_MONEY_PROVIDERS[provider];
  if (!providerData) return [];
  
  return AFRICAN_COUNTRIES.filter(country => 
    providerData.countries.includes(country.code)
  );
};

export const getProvidersForCountry = (countryCode: string): typeof MOBILE_MONEY_PROVIDERS[keyof typeof MOBILE_MONEY_PROVIDERS][] => {
  const country = getCountryByCode(countryCode);
  if (!country) return [];
  
  return country.mobileMoneyProviders
    .map(provider => MOBILE_MONEY_PROVIDERS[provider])
    .filter(Boolean);
};

export const getSupportedCountries = (): Country[] => {
  return AFRICAN_COUNTRIES.filter(country => country.isSupported);
};

export const getYellowCardSupportedCountries = (): Country[] => {
  return AFRICAN_COUNTRIES.filter(country => country.yellowCardSupported);
};

export const formatCurrency = (amount: number, currency: string): string => {
  const config = CURRENCY_CONFIG[currency as keyof typeof CURRENCY_CONFIG];
  if (!config) return `${amount}`;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'XOF' ? 'EUR' : currency, // Fallback for XOF
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  });
  
  if (currency === 'XOF') {
    return `${config.symbol} ${amount.toLocaleString()}`;
  }
  
  return formatter.format(amount).replace(/[A-Z]{3}/, config.symbol);
};

export const getAmountLimits = (countryCode: string): { min: number; max: number } => {
  const config = CURRENCY_CONFIG[getCountryByCode(countryCode)?.currency as keyof typeof CURRENCY_CONFIG];
  return {
    min: config?.minAmount || 1,
    max: config?.maxAmount || 1000000
  };
};

export const validatePhoneNumber = (phone: string, countryCode: string): {
  isValid: boolean;
  formatted?: string;
  carrier?: string;
} => {
  const country = getCountryByCode(countryCode);
  if (!country) {
    return { isValid: false };
  }
  
  // Remove any non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Country-specific validation patterns
  const patterns: Record<string, { pattern: RegExp; format: (phone: string) => string }> = {
    NG: {
      pattern: /^(234)?[789]\d{9}$/,
      format: (phone: string) => phone.startsWith('234') ? `+${phone}` : `+234${phone.slice(-10)}`
    },
    KE: {
      pattern: /^(254)?[17]\d{8}$/,
      format: (phone: string) => phone.startsWith('254') ? `+${phone}` : `+254${phone.slice(-9)}`
    },
    UG: {
      pattern: /^(256)?[37]\d{8}$/,
      format: (phone: string) => phone.startsWith('256') ? `+${phone}` : `+256${phone.slice(-9)}`
    },
    TZ: {
      pattern: /^(255)?[67]\d{8}$/,
      format: (phone: string) => phone.startsWith('255') ? `+${phone}` : `+255${phone.slice(-9)}`
    },
    GH: {
      pattern: /^(233)?[235]\d{8}$/,
      format: (phone: string) => phone.startsWith('233') ? `+${phone}` : `+233${phone.slice(-9)}`
    }
  };
  
  const validator = patterns[countryCode];
  if (!validator) {
    return { isValid: false };
  }
  
  const isValid = validator.pattern.test(cleanPhone);
  if (!isValid) {
    return { isValid: false };
  }
  
  const formatted = validator.format(cleanPhone);
  
  // Detect carrier based on number prefix
  const carrierMap: Record<string, Record<string, string>> = {
    NG: {
      '703': 'MTN', '706': 'MTN', '803': 'MTN', '806': 'MTN', '810': 'MTN', '813': 'MTN', '814': 'MTN', '816': 'MTN', '903': 'MTN', '906': 'MTN',
      '701': 'Airtel', '708': 'Airtel', '802': 'Airtel', '808': 'Airtel', '812': 'Airtel', '901': 'Airtel', '902': 'Airtel', '904': 'Airtel', '907': 'Airtel'
    },
    KE: {
      '110': 'Safaricom', '111': 'Safaricom', '112': 'Safaricom', '113': 'Safaricom', '114': 'Safaricom', '115': 'Safaricom',
      '700': 'Airtel', '701': 'Airtel', '702': 'Airtel', '703': 'Airtel', '704': 'Airtel', '705': 'Airtel', '706': 'Airtel', '707': 'Airtel', '708': 'Airtel', '709': 'Airtel'
    }
  };
  
  const carriers = carrierMap[countryCode];
  let carrier = 'Unknown';
  
  if (carriers) {
    const prefix = cleanPhone.slice(-9, -6); // Get 3-digit prefix
    carrier = carriers[prefix] || 'Unknown';
  }
  
  return {
    isValid: true,
    formatted,
    carrier
  };
};

export default {
  MOBILE_MONEY_PROVIDERS,
  AFRICAN_COUNTRIES,
  CURRENCY_CONFIG,
  getCountryByCode,
  getCountriesByProvider,
  getProvidersForCountry,
  getSupportedCountries,
  getYellowCardSupportedCountries,
  formatCurrency,
  getAmountLimits,
  validatePhoneNumber
}; 