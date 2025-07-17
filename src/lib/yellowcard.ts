/**
 * Yellow Card API Integration Layer
 * Supports Mobile Money to Crypto conversion for African markets
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Yellow Card API Configuration
interface YellowCardConfig {
  apiKey: string;
  secretKey: string;
  baseURL: string;
  environment: 'sandbox' | 'production';
  webhookSecret: string;
}

// Payment Types
export interface MobileMoneyProvider {
  code: string;
  name: string;
  country: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  processingTime: number; // in minutes
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  network: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  spread: number;
  validUntil: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  targetCurrency: string;
  targetAmount: number;
  exchangeRate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  paymentMethod: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
  instructions?: {
    paymentCode?: string;
    ussdCode?: string;
    accountNumber?: string;
    reference: string;
  };
  expiresAt: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface YellowCardWebhook {
  event: 'payment.completed' | 'payment.failed' | 'payment.pending' | 'rate.updated';
  data: {
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
    targetAmount: number;
    targetCurrency: string;
    transactionHash?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  signature: string;
}

export interface WalletBalance {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

export interface TransactionHistory {
  id: string;
  type: 'deposit' | 'withdrawal' | 'conversion' | 'transfer';
  amount: number;
  currency: string;
  status: string;
  transactionHash?: string;
  createdAt: string;
  description: string;
}

// Error Types
export class YellowCardError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'YellowCardError';
  }
}

export class YellowCardAPI {
  private client: AxiosInstance;
  private config: YellowCardConfig;

  constructor(config: YellowCardConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'User-Agent': 'NubiaGo/1.0.0'
      }
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const timestamp = Date.now().toString();
        const signature = this.generateSignature(
          config.method?.toUpperCase() || 'GET',
          config.url || '',
          config.data ? JSON.stringify(config.data) : '',
          timestamp
        );

        config.headers['X-Timestamp'] = timestamp;
        config.headers['X-Signature'] = signature;
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new YellowCardError(
            error.response.data?.message || 'API request failed',
            error.response.data?.code || 'API_ERROR',
            error.response.status,
            error.response.data
          );
        }
        throw new YellowCardError(
          error.message || 'Network error',
          'NETWORK_ERROR',
          0
        );
      }
    );
  }

  private generateSignature(method: string, path: string, body: string, timestamp: string): string {
    const crypto = require('crypto');
    const payload = `${method}${path}${body}${timestamp}`;
    
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(payload)
      .digest('hex');
  }

  // Get supported Mobile Money providers by country
  async getMobileMoneyProviders(country?: string): Promise<MobileMoneyProvider[]> {
    try {
      const response: AxiosResponse<{ providers: MobileMoneyProvider[] }> = await this.client.get(
        '/v1/payment-methods/mobile-money',
        { params: { country } }
      );
      
      return response.data.providers;
    } catch (error) {
      console.error('Error fetching Mobile Money providers:', error);
      throw error;
    }
  }

  // Get supported crypto assets
  async getCryptoAssets(): Promise<CryptoAsset[]> {
    try {
      const response: AxiosResponse<{ assets: CryptoAsset[] }> = await this.client.get(
        '/v1/assets/crypto'
      );
      
      return response.data.assets;
    } catch (error) {
      console.error('Error fetching crypto assets:', error);
      throw error;
    }
  }

  // Get real-time exchange rates
  async getExchangeRates(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    try {
      const response: AxiosResponse<{ rate: ExchangeRate }> = await this.client.get(
        '/v1/rates/exchange',
        {
          params: {
            from: fromCurrency,
            to: toCurrency
          }
        }
      );
      
      return response.data.rate;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  }

  // Create payment intent for Mobile Money to Crypto conversion
  async createPaymentIntent(params: {
    amount: number;
    currency: string; // Fiat currency (NGN, KES, etc.)
    targetCurrency: string; // Crypto currency (USDT, USDC, etc.)
    paymentMethod: string; // Mobile Money provider
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      country: string;
    };
    callbackUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    try {
      const response: AxiosResponse<{ payment: PaymentIntent }> = await this.client.post(
        '/v1/payments/create',
        {
          amount: params.amount,
          currency: params.currency,
          target_currency: params.targetCurrency,
          payment_method: params.paymentMethod,
          customer: params.customerInfo,
          callback_url: params.callbackUrl,
          metadata: params.metadata
        }
      );
      
      return response.data.payment;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    try {
      const response: AxiosResponse<{ payment: PaymentIntent }> = await this.client.get(
        `/v1/payments/${paymentId}`
      );
      
      return response.data.payment;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  // Cancel payment intent
  async cancelPayment(paymentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.post(
        `/v1/payments/${paymentId}/cancel`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }

  // Get user wallet balances
  async getWalletBalances(userId: string): Promise<WalletBalance[]> {
    try {
      const response: AxiosResponse<{ balances: WalletBalance[] }> = await this.client.get(
        `/v1/wallets/${userId}/balances`
      );
      
      return response.data.balances;
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      throw error;
    }
  }

  // Create crypto withdrawal
  async createWithdrawal(params: {
    userId: string;
    amount: number;
    currency: string;
    destinationAddress: string;
    network?: string;
    memo?: string;
  }): Promise<{ transactionId: string; status: string }> {
    try {
      const response: AxiosResponse<{ transaction: { id: string; status: string } }> = 
        await this.client.post('/v1/withdrawals/create', {
          user_id: params.userId,
          amount: params.amount,
          currency: params.currency,
          destination_address: params.destinationAddress,
          network: params.network,
          memo: params.memo
        });
      
      return {
        transactionId: response.data.transaction.id,
        status: response.data.transaction.status
      };
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(userId: string, options?: {
    limit?: number;
    offset?: number;
    type?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ transactions: TransactionHistory[]; total: number }> {
    try {
      const response: AxiosResponse<{ transactions: TransactionHistory[]; total: number }> = 
        await this.client.get(`/v1/users/${userId}/transactions`, {
          params: options
        });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Process webhook
  processWebhook(payload: string, signature: string): YellowCardWebhook {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new YellowCardError(
        'Invalid webhook signature',
        'INVALID_SIGNATURE',
        401
      );
    }

    try {
      return JSON.parse(payload) as YellowCardWebhook;
    } catch (error) {
      throw new YellowCardError(
        'Invalid webhook payload',
        'INVALID_PAYLOAD',
        400
      );
    }
  }

  // Get supported countries
  async getSupportedCountries(): Promise<{ code: string; name: string; currency: string; supported: boolean }[]> {
    try {
      const response: AxiosResponse<{ countries: any[] }> = await this.client.get(
        '/v1/countries'
      );
      
      return response.data.countries;
    } catch (error) {
      console.error('Error fetching supported countries:', error);
      throw error;
    }
  }

  // Validate phone number for Mobile Money
  async validatePhoneNumber(phone: string, country: string, provider: string): Promise<{
    valid: boolean;
    formatted: string;
    carrier?: string;
  }> {
    try {
      const response: AxiosResponse<{ validation: any }> = await this.client.post(
        '/v1/validation/phone',
        {
          phone,
          country,
          provider
        }
      );
      
      return response.data.validation;
    } catch (error) {
      console.error('Error validating phone number:', error);
      throw error;
    }
  }

  // Create user profile for KYC
  async createUserProfile(params: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    country: string;
    dateOfBirth?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }): Promise<{ userId: string; kycStatus: string }> {
    try {
      const response: AxiosResponse<{ user: { id: string; kyc_status: string } }> = 
        await this.client.post('/v1/users/create', {
          email: params.email,
          phone: params.phone,
          first_name: params.firstName,
          last_name: params.lastName,
          country: params.country,
          date_of_birth: params.dateOfBirth,
          address: params.address
        });
      
      return {
        userId: response.data.user.id,
        kycStatus: response.data.user.kyc_status
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Get KYC status
  async getKYCStatus(userId: string): Promise<{
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    level: number;
    limits: {
      daily: number;
      monthly: number;
      currency: string;
    };
    requiredDocuments?: string[];
  }> {
    try {
      const response: AxiosResponse<{ kyc: any }> = await this.client.get(
        `/v1/users/${userId}/kyc`
      );
      
      return response.data.kyc;
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      const response: AxiosResponse<{ status: string; timestamp: string }> = 
        await this.client.get('/v1/health');
      
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

// Factory function to create Yellow Card client
export function createYellowCardClient(config: YellowCardConfig): YellowCardAPI {
  return new YellowCardAPI(config);
}

// Default configuration for different environments
export const yellowCardConfig = {
  sandbox: {
    baseURL: 'https://api-sandbox.yellowcard.io',
    environment: 'sandbox' as const
  },
  production: {
    baseURL: 'https://api.yellowcard.io',
    environment: 'production' as const
  }
};

// Mobile Money provider mappings
export const MOBILE_MONEY_PROVIDERS = {
  NG: [
    { code: 'mtn_momo_ng', name: 'MTN Mobile Money', ussd: '*737#' },
    { code: 'airtel_money_ng', name: 'Airtel Money', ussd: '*432#' }
  ],
  KE: [
    { code: 'mpesa_ke', name: 'M-Pesa', ussd: '*334#' },
    { code: 'airtel_money_ke', name: 'Airtel Money', ussd: '*334#' }
  ],
  UG: [
    { code: 'mtn_momo_ug', name: 'MTN Mobile Money', ussd: '*165#' },
    { code: 'airtel_money_ug', name: 'Airtel Money', ussd: '*185#' }
  ],
  TZ: [
    { code: 'vodacom_mpesa_tz', name: 'Vodacom M-Pesa', ussd: '*150*00#' },
    { code: 'tigo_pesa_tz', name: 'Tigo Pesa', ussd: '*150*01#' },
    { code: 'airtel_money_tz', name: 'Airtel Money', ussd: '*150*60#' }
  ],
  GH: [
    { code: 'mtn_momo_gh', name: 'MTN Mobile Money', ussd: '*170#' },
    { code: 'vodafone_cash_gh', name: 'Vodafone Cash', ussd: '*110#' },
    { code: 'airtel_money_gh', name: 'AirtelTigo Money', ussd: '*100#' }
  ]
};

// Supported stablecoins
export const SUPPORTED_STABLECOINS = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    networks: ['TRC20', 'ERC20', 'BEP20'],
    decimals: 6
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    networks: ['ERC20', 'BEP20', 'POLYGON'],
    decimals: 6
  },
  {
    symbol: 'BUSD',
    name: 'Binance USD',
    networks: ['BEP20', 'ERC20'],
    decimals: 18
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    networks: ['ERC20'],
    decimals: 18
  }
];

export default YellowCardAPI; 