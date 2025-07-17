"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_STABLECOINS = exports.MOBILE_MONEY_PROVIDERS = exports.yellowCardConfig = exports.YellowCardAPI = exports.YellowCardError = void 0;
exports.createYellowCardClient = createYellowCardClient;
const axios_1 = __importDefault(require("axios"));
class YellowCardError extends Error {
    constructor(message, code, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'YellowCardError';
    }
}
exports.YellowCardError = YellowCardError;
class YellowCardAPI {
    constructor(config) {
        this.config = config;
        this.client = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.apiKey,
                'User-Agent': 'NubiaGo/1.0.0'
            }
        });
        this.client.interceptors.request.use((config) => {
            const timestamp = Date.now().toString();
            const signature = this.generateSignature(config.method?.toUpperCase() || 'GET', config.url || '', config.data ? JSON.stringify(config.data) : '', timestamp);
            config.headers['X-Timestamp'] = timestamp;
            config.headers['X-Signature'] = signature;
            return config;
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                throw new YellowCardError(error.response.data?.message || 'API request failed', error.response.data?.code || 'API_ERROR', error.response.status, error.response.data);
            }
            throw new YellowCardError(error.message || 'Network error', 'NETWORK_ERROR', 0);
        });
    }
    generateSignature(method, path, body, timestamp) {
        const crypto = require('crypto');
        const payload = `${method}${path}${body}${timestamp}`;
        return crypto
            .createHmac('sha256', this.config.secretKey)
            .update(payload)
            .digest('hex');
    }
    async getMobileMoneyProviders(country) {
        try {
            const response = await this.client.get('/v1/payment-methods/mobile-money', { params: { country } });
            return response.data.providers;
        }
        catch (error) {
            console.error('Error fetching Mobile Money providers:', error);
            throw error;
        }
    }
    async getCryptoAssets() {
        try {
            const response = await this.client.get('/v1/assets/crypto');
            return response.data.assets;
        }
        catch (error) {
            console.error('Error fetching crypto assets:', error);
            throw error;
        }
    }
    async getExchangeRates(fromCurrency, toCurrency) {
        try {
            const response = await this.client.get('/v1/rates/exchange', {
                params: {
                    from: fromCurrency,
                    to: toCurrency
                }
            });
            return response.data.rate;
        }
        catch (error) {
            console.error('Error fetching exchange rates:', error);
            throw error;
        }
    }
    async createPaymentIntent(params) {
        try {
            const response = await this.client.post('/v1/payments/create', {
                amount: params.amount,
                currency: params.currency,
                target_currency: params.targetCurrency,
                payment_method: params.paymentMethod,
                customer: params.customerInfo,
                callback_url: params.callbackUrl,
                metadata: params.metadata
            });
            return response.data.payment;
        }
        catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    }
    async getPaymentStatus(paymentId) {
        try {
            const response = await this.client.get(`/v1/payments/${paymentId}`);
            return response.data.payment;
        }
        catch (error) {
            console.error('Error fetching payment status:', error);
            throw error;
        }
    }
    async cancelPayment(paymentId) {
        try {
            const response = await this.client.post(`/v1/payments/${paymentId}/cancel`);
            return response.data;
        }
        catch (error) {
            console.error('Error cancelling payment:', error);
            throw error;
        }
    }
    async getWalletBalances(userId) {
        try {
            const response = await this.client.get(`/v1/wallets/${userId}/balances`);
            return response.data.balances;
        }
        catch (error) {
            console.error('Error fetching wallet balances:', error);
            throw error;
        }
    }
    async createWithdrawal(params) {
        try {
            const response = await this.client.post('/v1/withdrawals/create', {
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
        }
        catch (error) {
            console.error('Error creating withdrawal:', error);
            throw error;
        }
    }
    async getTransactionHistory(userId, options) {
        try {
            const response = await this.client.get(`/v1/users/${userId}/transactions`, {
                params: options
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching transaction history:', error);
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.config.webhookSecret)
            .update(payload)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    processWebhook(payload, signature) {
        if (!this.verifyWebhookSignature(payload, signature)) {
            throw new YellowCardError('Invalid webhook signature', 'INVALID_SIGNATURE', 401);
        }
        try {
            return JSON.parse(payload);
        }
        catch (error) {
            throw new YellowCardError('Invalid webhook payload', 'INVALID_PAYLOAD', 400);
        }
    }
    async getSupportedCountries() {
        try {
            const response = await this.client.get('/v1/countries');
            return response.data.countries;
        }
        catch (error) {
            console.error('Error fetching supported countries:', error);
            throw error;
        }
    }
    async validatePhoneNumber(phone, country, provider) {
        try {
            const response = await this.client.post('/v1/validation/phone', {
                phone,
                country,
                provider
            });
            return response.data.validation;
        }
        catch (error) {
            console.error('Error validating phone number:', error);
            throw error;
        }
    }
    async createUserProfile(params) {
        try {
            const response = await this.client.post('/v1/users/create', {
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
        }
        catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }
    async getKYCStatus(userId) {
        try {
            const response = await this.client.get(`/v1/users/${userId}/kyc`);
            return response.data.kyc;
        }
        catch (error) {
            console.error('Error fetching KYC status:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const response = await this.client.get('/v1/health');
            return response.data;
        }
        catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}
exports.YellowCardAPI = YellowCardAPI;
function createYellowCardClient(config) {
    return new YellowCardAPI(config);
}
exports.yellowCardConfig = {
    sandbox: {
        baseURL: 'https://api-sandbox.yellowcard.io',
        environment: 'sandbox'
    },
    production: {
        baseURL: 'https://api.yellowcard.io',
        environment: 'production'
    }
};
exports.MOBILE_MONEY_PROVIDERS = {
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
exports.SUPPORTED_STABLECOINS = [
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
exports.default = YellowCardAPI;
//# sourceMappingURL=yellowcard.js.map