/**
 * Payment Module Exports
 * Centralized exports for all payment-related components, hooks, and utilities
 */

// Component exports
export { PaymentGateway } from './components/PaymentGateway';
export { PaymentGatewayWithLocation } from './components/PaymentGatewayWithLocation';
export { DynamicProviderSelector } from './components/DynamicProviderSelector';
export { MobileMoneyPaymentForm } from './components/MobileMoneyPaymentForm';
export { MobileMoneyFlow } from './components/MobileMoneyFlow';

// Hook exports
export { usePaymentMethods } from './hooks/usePaymentMethods';
export { useUserLocation, useProvidersForCountry, useProviderSelection } from '../hooks/useUserLocation';

// Type exports
export type {
  PaymentMethod,
  PaymentIntent,
  PaymentGatewayProps,
  PaymentFlowState,
  PaymentFormData,
  MobileMoneyProvider,
  FiatCurrency,
  CryptoCurrency,
  Country,
  ExchangeRate,
  WalletBalance,
  PaymentStatus,
  TransactionType,
  PaymentMethodType,
  MobileMoneyFlowProps
} from './types';

// Utility exports
export {
  validatePhoneNumber,
  validateAmount,
  validatePaymentForm,
  isProviderAvailableInCountry,
  getAvailableProvidersForCountry,
  formatCurrency,
  cleanPhoneNumber,
  getCountryFromPhoneNumber
} from './utils/validation';

// Constants exports
export {
  MOBILE_MONEY_PROVIDERS,
  AFRICAN_COUNTRIES,
  CURRENCY_CONFIG,
  getProvidersForCountry,
  getCountryByCode,
  getSupportedCountries,
  getYellowCardSupportedCountries,
  formatCurrency as formatCurrencyDisplay,
  getAmountLimits
} from './constants/countries';

// Service exports
export { geoIPService, detectUserCountry, isUserInSupportedRegion } from '../lib/geoip'; 