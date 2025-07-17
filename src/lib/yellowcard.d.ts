interface YellowCardConfig {
    apiKey: string;
    secretKey: string;
    baseURL: string;
    environment: 'sandbox' | 'production';
    webhookSecret: string;
}
export interface MobileMoneyProvider {
    code: string;
    name: string;
    country: string;
    currency: string;
    minAmount: number;
    maxAmount: number;
    processingTime: number;
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
export declare class YellowCardError extends Error {
    code: string;
    statusCode: number;
    details?: any | undefined;
    constructor(message: string, code: string, statusCode: number, details?: any | undefined);
}
export declare class YellowCardAPI {
    private client;
    private config;
    constructor(config: YellowCardConfig);
    private generateSignature;
    getMobileMoneyProviders(country?: string): Promise<MobileMoneyProvider[]>;
    getCryptoAssets(): Promise<CryptoAsset[]>;
    getExchangeRates(fromCurrency: string, toCurrency: string): Promise<ExchangeRate>;
    createPaymentIntent(params: {
        amount: number;
        currency: string;
        targetCurrency: string;
        paymentMethod: string;
        customerInfo: {
            name: string;
            email: string;
            phone: string;
            country: string;
        };
        callbackUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<PaymentIntent>;
    getPaymentStatus(paymentId: string): Promise<PaymentIntent>;
    cancelPayment(paymentId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getWalletBalances(userId: string): Promise<WalletBalance[]>;
    createWithdrawal(params: {
        userId: string;
        amount: number;
        currency: string;
        destinationAddress: string;
        network?: string;
        memo?: string;
    }): Promise<{
        transactionId: string;
        status: string;
    }>;
    getTransactionHistory(userId: string, options?: {
        limit?: number;
        offset?: number;
        type?: string;
        currency?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        transactions: TransactionHistory[];
        total: number;
    }>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
    processWebhook(payload: string, signature: string): YellowCardWebhook;
    getSupportedCountries(): Promise<{
        code: string;
        name: string;
        currency: string;
        supported: boolean;
    }[]>;
    validatePhoneNumber(phone: string, country: string, provider: string): Promise<{
        valid: boolean;
        formatted: string;
        carrier?: string;
    }>;
    createUserProfile(params: {
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
    }): Promise<{
        userId: string;
        kycStatus: string;
    }>;
    getKYCStatus(userId: string): Promise<{
        status: 'pending' | 'under_review' | 'approved' | 'rejected';
        level: number;
        limits: {
            daily: number;
            monthly: number;
            currency: string;
        };
        requiredDocuments?: string[];
    }>;
    healthCheck(): Promise<{
        status: 'ok' | 'error';
        timestamp: string;
    }>;
}
export declare function createYellowCardClient(config: YellowCardConfig): YellowCardAPI;
export declare const yellowCardConfig: {
    sandbox: {
        baseURL: string;
        environment: "sandbox";
    };
    production: {
        baseURL: string;
        environment: "production";
    };
};
export declare const MOBILE_MONEY_PROVIDERS: {
    NG: {
        code: string;
        name: string;
        ussd: string;
    }[];
    KE: {
        code: string;
        name: string;
        ussd: string;
    }[];
    UG: {
        code: string;
        name: string;
        ussd: string;
    }[];
    TZ: {
        code: string;
        name: string;
        ussd: string;
    }[];
    GH: {
        code: string;
        name: string;
        ussd: string;
    }[];
};
export declare const SUPPORTED_STABLECOINS: {
    symbol: string;
    name: string;
    networks: string[];
    decimals: number;
}[];
export default YellowCardAPI;
//# sourceMappingURL=yellowcard.d.ts.map