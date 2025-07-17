/**
 * Next.js API Route: /api/payments/initiate
 * Handles mobile money payment initiation
 * Accepts: phone, amount, country, provider
 * Validates input, stores in payment_intents, calls Yellow Card API
 * Returns: transaction reference + redirect URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Yellow Card API configuration
const YELLOWCARD_API_URL = process.env.YELLOWCARD_API_URL || 'https://api.yellowcard.io';
const YELLOWCARD_API_KEY = process.env.YELLOWCARD_API_KEY;
const YELLOWCARD_SECRET = process.env.YELLOWCARD_SECRET;
const TEST_MODE = process.env.NODE_ENV !== 'production' || process.env.PAYMENT_TEST_MODE === 'true';

interface PaymentInitiateRequest {
  phone: string;
  amount: number;
  country: string;
  provider: string;
  currency?: string;
  userId?: string;
}

interface PaymentInitiateResponse {
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

// Phone validation patterns by country
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

// Supported providers by country
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

export async function POST(request: NextRequest) {
  try {
    const body: PaymentInitiateRequest = await request.json();
    
    // Validate required fields
    const { phone, amount, country, provider, currency = 'USD', userId } = body;
    
    if (!phone || !amount || !country || !provider) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: phone, amount, country, provider'
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0 || amount > 100000) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be between 0 and 100,000'
      }, { status: 400 });
    }

    // Validate phone number format
    const phonePattern = PHONE_PATTERNS[country.toUpperCase()];
    if (!phonePattern || !phonePattern.test(phone.replace(/\s+/g, ''))) {
      return NextResponse.json({
        success: false,
        error: `Invalid phone number format for ${country}`
      }, { status: 400 });
    }

    // Validate provider for country
    const supportedProviders = SUPPORTED_PROVIDERS[country.toUpperCase()];
    if (!supportedProviders || !supportedProviders.includes(provider)) {
      return NextResponse.json({
        success: false,
        error: `Provider ${provider} not supported in ${country}`
      }, { status: 400 });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone, country);
    
    // Generate transaction reference
    const transactionId = generateTransactionId();
    const reference = generatePaymentReference(provider, country);

    // Store payment intent in Supabase
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
      return NextResponse.json({
        success: false,
        error: 'Failed to create payment intent'
      }, { status: 500 });
    }

    // Call Yellow Card API or mock it in test mode
    let yellowCardResponse;
    
    if (TEST_MODE) {
      // Mock Yellow Card response for testing
      yellowCardResponse = await mockYellowCardAPI(formattedPhone, amount, currency, provider, reference);
    } else {
      // Call real Yellow Card API
      yellowCardResponse = await callYellowCardAPI(formattedPhone, amount, currency, provider, reference);
    }

    if (!yellowCardResponse.success) {
      // Update payment intent status to failed
      await supabase
        .from('payment_intents')
        .update({ status: 'failed' })
        .eq('id', transactionId);

      return NextResponse.json({
        success: false,
        error: yellowCardResponse.error || 'Payment initiation failed'
      }, { status: 400 });
    }

    // Update payment intent with Yellow Card response
    await supabase
      .from('payment_intents')
      .update({ 
        status: 'pending',
        tx_hash: yellowCardResponse.txHash 
      })
      .eq('id', transactionId);

    // Get provider instructions
    const instructions = await getProviderInstructions(provider, country, reference);

    const response: PaymentInitiateResponse = {
      success: true,
      transactionId,
      reference,
      redirectUrl: yellowCardResponse.redirectUrl,
      message: `Payment initiated successfully with ${provider}`,
      instructions
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper functions

function generateTransactionId(): string {
  return `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generatePaymentReference(provider: string, country: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${provider.slice(0, 3)}_${country}_${timestamp}_${random}`;
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

async function callYellowCardAPI(phone: string, amount: number, currency: string, provider: string, reference: string) {
  try {
    if (!YELLOWCARD_API_KEY || !YELLOWCARD_SECRET) {
      throw new Error('Yellow Card API credentials not configured');
    }

    const timestamp = Date.now().toString();
    const payload = {
      phone,
      amount,
      currency,
      provider,
      reference,
      timestamp
    };

    // Create signature for Yellow Card API
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
  await new Promise(resolve => setTimeout(resolve, 1000));
  
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
  // Get provider details from database
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
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    testMode: TEST_MODE
  });
} 