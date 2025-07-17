/**
 * Payment Controller - Enhanced for exact payment_intents schema
 * Fast validation and Yellow Card integration
 */

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import crypto from 'crypto';

// Types matching the exact schema
interface PaymentIntentRequest {
  phone: string;
  amount: number;
  country: string;
  provider: string;
  currency?: string;
  userId?: string;
}

interface PaymentIntentResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  redirectUrl?: string;
  message: string;
  instructions?: {
    steps: string[];
    ussdCode?: string;
  };
  error?: string;
}

// Fast validation patterns
const PHONE_PATTERNS: Record<string, RegExp> = {
  'NG': /^(\+234|234|0)?[789][01]\d{8}$/,
  'KE': /^(\+254|254|0)?[17]\d{8}$/,
  'UG': /^(\+256|256|0)?[37]\d{8}$/,
  'GH': /^(\+233|233|0)?[235]\d{8}$/,
  'TZ': /^(\+255|255|0)?[67]\d{8}$/,
  'ZA': /^(\+27|27|0)?[67]\d{8}$/,
  'SN': /^(\+221|221|0)?[37]\d{8}$/,
  'BF': /^(\+226|226|0)?[67]\d{7}$/,
  'TG': /^(\+228|228|0)?[92]\d{7}$/,
  'CI': /^(\+225|225|0)?[0457]\d{7}$/,
  'CM': /^(\+237|237|0)?[62]\d{8}$/,
};

const SUPPORTED_PROVIDERS: Record<string, string[]> = {
  'NG': ['MTN_MOMO', 'AIRTEL_MONEY'],
  'KE': ['MPESA', 'AIRTEL_MONEY'],
  'UG': ['MTN_MOMO', 'AIRTEL_MONEY'],
  'GH': ['MTN_MOMO', 'VODAFONE_CASH'],
  'TZ': ['TIGO_CASH', 'AIRTEL_MONEY'],
  'ZA': ['MTN_MOMO'],
  'SN': ['ORANGE_MONEY', 'WAVE'],
  'BF': ['MOOV_MONEY'],
  'TG': ['FLOOZ'],
  'CI': ['MTN_MOMO', 'ORANGE_MONEY'],
  'CM': ['MTN_MOMO', 'ORANGE_MONEY'],
};

export class PaymentController {
  /**
   * POST /api/payments/initiate
   * Fast payment initiation with validation
   */
  static async initiatePayment(req: Request, res: Response) {
    try {
      const { phone, amount, country, provider, currency = 'USD', userId } = req.body as PaymentIntentRequest;

      // Fast validation - fail early
      const validationError = validatePaymentRequest(phone, amount, country, provider);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError
        });
      }

      // Format phone number
      const formattedPhone = formatPhoneNumber(phone, country);
      
      // Generate IDs
      const transactionId = generateTransactionId();
      const reference = generatePaymentReference(provider, country);

      // Store in payment_intents table with exact schema
      const { data: paymentIntent, error: dbError } = await supabase
        .from('payment_intents')
        .insert({
          id: transactionId,
          user_id: userId || null,
          amount: amount,
          currency: currency,
          country: country.toUpperCase(),
          provider: provider,
          phone_number: formattedPhone,
          status: 'initiated'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create payment intent'
        });
      }

      // Call Yellow Card API or mock it
      const isTestMode = process.env.NODE_ENV !== 'production' || process.env.PAYMENT_TEST_MODE === 'true';
      const yellowCardResponse = isTestMode 
        ? await mockYellowCardAPI(formattedPhone, amount, currency, provider, reference)
        : await callYellowCardAPI(formattedPhone, amount, currency, provider, reference);

      if (!yellowCardResponse.success) {
        // Update status to failed
        await supabase
          .from('payment_intents')
          .update({ status: 'failed' })
          .eq('id', transactionId);

        return res.status(400).json({
          success: false,
          error: yellowCardResponse.error || 'Payment initiation failed'
        });
      }

      // Update status to pending with tx_hash
      await supabase
        .from('payment_intents')
        .update({ 
          status: 'pending',
          tx_hash: yellowCardResponse.txHash 
        })
        .eq('id', transactionId);

      // Get provider instructions
      const instructions = await getProviderInstructions(provider, country, reference);

      const response: PaymentIntentResponse = {
        success: true,
        transactionId,
        reference,
        redirectUrl: yellowCardResponse.redirectUrl,
        message: `Payment initiated successfully with ${provider}`,
        instructions
      };

      res.json(response);

    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/payments/status/:transactionId
   * Check payment status
   */
  static async getPaymentStatus(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;

      const { data: paymentIntent, error } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !paymentIntent) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        country: paymentIntent.country,
        provider: paymentIntent.provider,
        phone_number: paymentIntent.phone_number,
        tx_hash: paymentIntent.tx_hash,
        created_at: paymentIntent.created_at
      });

    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/payments/update-status
   * Update payment status (for webhooks)
   */
  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { transactionId, status, txHash } = req.body;

      // Validate status enum
      const validStatuses = ['initiated', 'pending', 'confirmed', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: initiated, pending, confirmed, failed'
        });
      }

      const updateData: any = { status };
      if (txHash) updateData.tx_hash = txHash;

      const { data: paymentIntent, error } = await supabase
        .from('payment_intents')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error || !paymentIntent) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Payment status updated successfully'
      });

    } catch (error) {
      console.error('Payment status update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/payments/user/:userId
   * Get user's payment intents
   */
  static async getUserPayments(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);

      const { data: payments, error, count } = await supabase
        .from('payment_intents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch payments'
        });
      }

      res.json({
        success: true,
        payments: payments || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / Number(limit))
        }
      });

    } catch (error) {
      console.error('Get user payments error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// Helper functions for fast validation and processing

function validatePaymentRequest(phone: string, amount: number, country: string, provider: string): string | null {
  // Required fields
  if (!phone || !amount || !country || !provider) {
    return 'Missing required fields: phone, amount, country, provider';
  }

  // Amount validation
  if (amount <= 0 || amount > 100000) {
    return 'Amount must be between 0 and 100,000';
  }

  // Country validation
  const countryUpper = country.toUpperCase();
  if (!PHONE_PATTERNS[countryUpper]) {
    return `Country ${country} not supported`;
  }

  // Phone validation
  const phonePattern = PHONE_PATTERNS[countryUpper];
  if (!phonePattern.test(phone.replace(/\s+/g, ''))) {
    return `Invalid phone number format for ${country}`;
  }

  // Provider validation
  const supportedProviders = SUPPORTED_PROVIDERS[countryUpper];
  if (!supportedProviders || !supportedProviders.includes(provider)) {
    return `Provider ${provider} not supported in ${country}`;
  }

  return null;
}

function formatPhoneNumber(phone: string, country: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  const formatters: Record<string, (num: string) => string> = {
    'NG': (num) => {
      if (num.startsWith('234')) return `+${num}`;
      if (num.startsWith('0')) return `+234${num.slice(1)}`;
      return `+234${num}`;
    },
    'KE': (num) => {
      if (num.startsWith('254')) return `+${num}`;
      if (num.startsWith('0')) return `+254${num.slice(1)}`;
      return `+254${num}`;
    },
    'UG': (num) => {
      if (num.startsWith('256')) return `+${num}`;
      if (num.startsWith('0')) return `+256${num.slice(1)}`;
      return `+256${num}`;
    }
  };

  const formatter = formatters[country.toUpperCase()];
  return formatter ? formatter(cleaned) : phone;
}

function generateTransactionId(): string {
  return `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generatePaymentReference(provider: string, country: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${provider.slice(0, 3)}_${country}_${timestamp}_${random}`;
}

async function callYellowCardAPI(phone: string, amount: number, currency: string, provider: string, reference: string) {
  try {
    const YELLOWCARD_API_URL = process.env.YELLOWCARD_API_URL || 'https://api.yellowcard.io';
    const YELLOWCARD_API_KEY = process.env.YELLOWCARD_API_KEY;
    const YELLOWCARD_SECRET = process.env.YELLOWCARD_SECRET;

    if (!YELLOWCARD_API_KEY || !YELLOWCARD_SECRET) {
      throw new Error('Yellow Card API credentials not configured');
    }

    const timestamp = Date.now().toString();
    const payload = { phone, amount, currency, provider, reference, timestamp };

    const signature = crypto
      .createHmac('sha256', YELLOWCARD_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await fetch(`${YELLOWCARD_API_URL}/v1/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YELLOWCARD_API_KEY}`,
        'X-Signature': signature,
        'X-Timestamp': timestamp
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Yellow Card API error');
    }

    const data = await response.json();
    
    return {
      success: true,
      txHash: data.transaction_hash,
      redirectUrl: data.redirect_url,
      yellowCardId: data.payment_id
    };

  } catch (error) {
    console.error('Yellow Card API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Yellow Card API failed'
    };
  }
}

async function mockYellowCardAPI(phone: string, amount: number, currency: string, provider: string, reference: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock successful response
  const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
  
  return {
    success: true,
    txHash: mockTxHash,
    redirectUrl: `https://mock-payment.example.com/complete/${reference}`,
    yellowCardId: `YC_${Date.now()}`
  };
}

async function getProviderInstructions(provider: string, country: string, reference: string) {
  try {
    const { data: providerData } = await supabase
      .from('mobile_money_providers')
      .select('ussd_code, instructions')
      .eq('country', country.toUpperCase())
      .eq('provider', provider)
      .single();

    if (!providerData) {
      return {
        steps: [
          'Contact customer support for payment instructions',
          `Reference: ${reference}`
        ]
      };
    }

    const instructionsData = typeof providerData.instructions === 'string' 
      ? JSON.parse(providerData.instructions)
      : providerData.instructions;

    return {
      steps: instructionsData?.steps || [
        `Use ${provider} to complete your payment`,
        `Reference: ${reference}`
      ],
      ussdCode: providerData.ussd_code
    };
  } catch (error) {
    console.error('Error getting provider instructions:', error);
    return {
      steps: [
        `Complete payment using ${provider}`,
        `Reference: ${reference}`
      ]
    };
  }
}

export default PaymentController; 