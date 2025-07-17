/**
 * Payment System Types
 * Comprehensive type definitions for Mobile Money and Crypto payments
 */

// Base currency types
export type FiatCurrency = 'NGN' | 'KES' | 'UGX' | 'TZS' | 'GHS' | 'ZAR' | 'XOF';
export type CryptoCurrency = 'USDT' | 'USDC' | 'BUSD' | 'DAI' | 'BTC' | 'ETH';
export type Currency = FiatCurrency | CryptoCurrency;

// Payment method types
export type PaymentMethodType = 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CRYPTO' | 'CARD' | 'YELLOWCARD';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'REFUND' | 'CONVERSION' | 'TRANSFER';

// Mobile Money providers
export type MobileMoneyProvider = 
  | 'MTN_MOMO' 
  | 'VODAFONE_CASH' 
  | 'TIGO_CASH' 
  | 'AIRTEL_MONEY'
  | 'MPESA' 
  | 'ORANGE_MONEY' 
  | 'MOOV_MONEY' 
  | 'WAVE' 
  | 'FLOOZ';

// Crypto networks
export type CryptoNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'POLYGON';

// Country information
export interface Country {
  id: string;
  code: string;
  name: string;
  currency: FiatCurrency;
  isSupported: boolean;
  mobileMoneyProviders: MobileMoneyProvider[];
  yellowCardSupported: boolean;
  flag: string;
  dialCode: string;
}

// Payment method information
export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  provider: string;
  countryCode: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  feePercentage: number;
  feeFixed: number;
  processingTimeMinutes: number;
  icon: string;
  description?: string;
  metadata: Record<string, any>;
}

// Exchange rate information
export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  spread?: number;
  validUntil: string;
  provider: string;
  lastUpdated: string;
}

// Customer information
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  country: string;
}

// Payment instructions
export interface PaymentInstructions {
  reference: string;
  paymentCode?: string;
  ussdCode?: string;
  accountNumber?: string;
  bankName?: string;
  steps: string[];
  expiresAt: string;
}

// Payment intent
export interface PaymentIntent {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  currency: FiatCurrency;
  targetCurrency?: CryptoCurrency;
  targetAmount?: number;
  paymentMethodId: string;
  paymentMethod?: PaymentMethod;
  providerTransactionId?: string;
  yellowCardPaymentId?: string;
  status: PaymentStatus;
  type: TransactionType;
  description: string;
  customerInfo: CustomerInfo;
  countryCode: string;
  providerFees: number;
  platformFees: number;
  exchangeRate?: number;
  instructions?: PaymentInstructions;
  expiresAt: string;
  completedAt?: string;
  failedReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// User wallet
export interface UserWallet {
  id: string;
  userId: string;
  currency: Currency;
  balance: number;
  lockedBalance: number;
  yellowCardWalletId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transaction record
export interface Transaction {
  id: string;
  userId: string;
  walletId?: string;
  paymentIntentId?: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  providerReference?: string;
  transactionHash?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

// Payment form data
export interface PaymentFormData {
  amount: number;
  currency: FiatCurrency;
  targetCurrency?: CryptoCurrency;
  paymentMethodId: string;
  customerInfo: CustomerInfo;
  orderId?: string;
  saveProfile?: boolean;
  metadata?: Record<string, any>;
}

// Withdrawal form data
export interface WithdrawalFormData {
  amount: number;
  currency: CryptoCurrency;
  destinationAddress: string;
  network: CryptoNetwork;
  memo?: string;
  saveAddress?: boolean;
}

// Payment validation errors
export interface PaymentValidationError {
  field: string;
  message: string;
  code: string;
}

// Payment flow state
export interface PaymentFlowState {
  step: 'select-method' | 'enter-details' | 'confirm' | 'processing' | 'success' | 'failed';
  paymentMethod?: PaymentMethod;
  formData?: PaymentFormData;
  paymentIntent?: PaymentIntent;
  error?: string;
  loading: boolean;
}

// Wallet balance summary
export interface WalletBalanceSummary {
  wallets: UserWallet[];
  totalBalanceUSD: number;
  yellowCardBalances: YellowCardBalance[];
  hasActiveWallets: boolean;
}

// Yellow Card specific types
export interface YellowCardBalance {
  currency: Currency;
  available: number;
  locked: number;
  total: number;
}

export interface YellowCardProvider {
  code: string;
  name: string;
  country: string;
  currency: FiatCurrency;
  minAmount: number;
  maxAmount: number;
  processingTime: number;
  icon: string;
  ussdCode?: string;
}

export interface YellowCardPayment {
  id: string;
  amount: number;
  currency: FiatCurrency;
  targetCurrency: CryptoCurrency;
  targetAmount: number;
  exchangeRate: number;
  status: PaymentStatus;
  paymentMethod: string;
  customerInfo: CustomerInfo;
  instructions: PaymentInstructions;
  expiresAt: string;
  createdAt: string;
  metadata: Record<string, any>;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// Hook return types
export interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getMethodsByCountry: (countryCode: string) => PaymentMethod[];
  getMethodByProvider: (provider: string) => PaymentMethod | null;
}

export interface UsePaymentIntentReturn {
  paymentIntent: PaymentIntent | null;
  loading: boolean;
  error: string | null;
  createPaymentIntent: (data: PaymentFormData) => Promise<PaymentIntent>;
  checkPaymentStatus: (id: string) => Promise<PaymentIntent>;
  cancelPayment: (id: string) => Promise<void>;
  retryPayment: (id: string) => Promise<PaymentIntent>;
}

export interface UseWalletBalanceReturn {
  wallets: UserWallet[];
  totalBalance: number;
  totalBalanceUSD: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getWalletByCurrency: (currency: Currency) => UserWallet | null;
  hasInsufficientFunds: (amount: number, currency: Currency) => boolean;
}

export interface UseExchangeRatesReturn {
  rates: Map<string, ExchangeRate>;
  loading: boolean;
  error: string | null;
  getRate: (from: Currency, to: Currency) => ExchangeRate | null;
  convertAmount: (amount: number, from: Currency, to: Currency) => number | null;
  refreshRates: () => Promise<void>;
}

export interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  filterByType: (type: TransactionType | null) => void;
  filterByCurrency: (currency: Currency | null) => void;
}

// Payment context types
export interface PaymentContextValue {
  // State
  selectedCountry: Country | null;
  selectedPaymentMethod: PaymentMethod | null;
  paymentFlow: PaymentFlowState;
  
  // Payment methods
  paymentMethods: PaymentMethod[];
  
  // Wallet and balances
  wallets: UserWallet[];
  totalBalance: number;
  
  // Exchange rates
  exchangeRates: Map<string, ExchangeRate>;
  
  // Actions
  setSelectedCountry: (country: Country | null) => void;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  createPayment: (data: PaymentFormData) => Promise<PaymentIntent>;
  checkPaymentStatus: (id: string) => Promise<PaymentIntent>;
  cancelPayment: (id: string) => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshRates: () => Promise<void>;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Component props types
export interface PaymentGatewayProps {
  orderId?: string;
  amount?: number;
  currency?: FiatCurrency;
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  countryCode?: string;
  amount?: number;
  currency?: FiatCurrency;
  className?: string;
}

export interface MobileMoneyFlowProps {
  paymentMethod: PaymentMethod;
  amount: number;
  currency: FiatCurrency;
  targetCurrency?: CryptoCurrency;
  onPaymentCreated: (paymentIntent: PaymentIntent) => void;
  onError: (error: string) => void;
  className?: string;
}

export interface PaymentStatusProps {
  paymentIntent: PaymentIntent;
  onRetry?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  className?: string;
}

export interface WalletBalanceProps {
  showAllCurrencies?: boolean;
  showConversionRates?: boolean;
  className?: string;
}

export interface CryptoConversionProps {
  fromAmount: number;
  fromCurrency: FiatCurrency;
  toCurrency: CryptoCurrency;
  exchangeRate?: ExchangeRate;
  onConversionChange?: (toAmount: number) => void;
  className?: string;
}

// Utility function types
export type CurrencyFormatter = (amount: number, currency: Currency, locale?: string) => string;
export type PhoneNumberFormatter = (phone: string, countryCode?: string) => string;
export type CountryDetector = () => Promise<Country | null>;
export type PaymentValidator = (data: PaymentFormData) => PaymentValidationError[];

// Event types
export interface PaymentEvent {
  type: 'payment_created' | 'payment_completed' | 'payment_failed' | 'payment_cancelled';
  paymentId: string;
  data: any;
  timestamp: string;
}

export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  signature: string;
}

// Configuration types
export interface PaymentConfig {
  yellowCard: {
    apiKey: string;
    environment: 'sandbox' | 'production';
    webhookSecret: string;
  };
  defaultCurrency: FiatCurrency;
  supportedCountries: string[];
  enableTestMode: boolean;
  maxTransactionAmount: number;
  sessionTimeout: number;
}

export default {
  // Re-export all types for convenience
  FiatCurrency,
  CryptoCurrency,
  Currency,
  PaymentMethodType,
  PaymentStatus,
  TransactionType,
  MobileMoneyProvider,
  CryptoNetwork
}; 