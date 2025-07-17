/**
 * Yellow Card Webhook Handler
 * Secure webhook with signature verification
 * Handles payment confirmations and wallet crediting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YELLOWCARD_WEBHOOK_SECRET = process.env.YELLOWCARD_WEBHOOK_SECRET!;

interface YellowCardWebhookPayload {
  payment_id: string;
  reference: string;
  status: 'initiated' | 'pending' | 'confirmed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  transaction_hash?: string;
  customer_phone: string;
  provider: string;
  country: string;
  timestamp: string;
  fees?: {
    provider_fee: number;
    platform_fee: number;
  };
  metadata?: Record<string, any>;
}

interface WalletCreditResult {
  success: boolean;
  walletId?: string;
  newBalance?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook payload
    const body = await request.text();
    const payload: YellowCardWebhookPayload = JSON.parse(body);

    // Verify webhook signature
    const signature = request.headers.get('x-yellowcard-signature');
    const timestamp = request.headers.get('x-yellowcard-timestamp');

    if (!signature || !timestamp) {
      console.error('Missing webhook signature or timestamp');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 401 }
      );
    }

    // Verify signature
    const isValidSignature = verifyWebhookSignature(body, signature, timestamp);
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Verify timestamp (prevent replay attacks)
    const webhookTimestamp = parseInt(timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - webhookTimestamp);
    
    if (timeDifference > 300) { // 5 minutes tolerance
      console.error('Webhook timestamp too old:', timeDifference);
      return NextResponse.json(
        { error: 'Timestamp too old' },
        { status: 401 }
      );
    }

    console.log('Processing Yellow Card webhook:', {
      payment_id: payload.payment_id,
      reference: payload.reference,
      status: payload.status
    });

    // Find matching payment intent
    const { data: paymentIntent, error: findError } = await supabase
      .from('payment_intents')
      .select('*')
      .or(`tx_hash.eq.${payload.transaction_hash},id.eq.${payload.reference}`)
      .single();

    if (findError || !paymentIntent) {
      console.error('Payment intent not found:', payload.reference, findError);
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Map Yellow Card status to our enum
    const mappedStatus = mapYellowCardStatus(payload.status);

    // Update payment intent
    const { error: updateError } = await supabase
      .from('payment_intents')
      .update({
        status: mappedStatus,
        tx_hash: payload.transaction_hash || paymentIntent.tx_hash
      })
      .eq('id', paymentIntent.id);

    if (updateError) {
      console.error('Failed to update payment intent:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    // If payment is confirmed, credit user wallet
    let walletResult: WalletCreditResult | null = null;
    if (payload.status === 'confirmed' && paymentIntent.user_id) {
      walletResult = await creditUserWallet(
        paymentIntent.user_id,
        payload.amount,
        'USDC', // Default to USDC for confirmed payments
        paymentIntent.id,
        payload.transaction_hash
      );

      if (!walletResult.success) {
        console.error('Failed to credit wallet:', walletResult.error);
        // Don't fail the webhook, but log the error
      }
    }

    // Log webhook event for admin monitoring
    await logWebhookEvent({
      payment_intent_id: paymentIntent.id,
      webhook_type: 'yellowcard_payment',
      status: payload.status,
      payload: payload,
      processed_at: new Date().toISOString(),
      wallet_credited: walletResult?.success || false,
      wallet_id: walletResult?.walletId
    });

    // Return success response
    return NextResponse.json({
      success: true,
      payment_id: paymentIntent.id,
      status: mappedStatus,
      wallet_credited: walletResult?.success || false,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Yellow Card webhook error:', error);
    
    // Log failed webhook attempt
    await logWebhookEvent({
      webhook_type: 'yellowcard_payment',
      status: 'error',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      processed_at: new Date().toISOString(),
      wallet_credited: false
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Yellow Card webhook signature using HMAC
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    if (!YELLOWCARD_WEBHOOK_SECRET) {
      console.error('Yellow Card webhook secret not configured');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', YELLOWCARD_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    // Compare signatures (timing-safe comparison)
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Map Yellow Card status to our payment_intent_status enum
 */
function mapYellowCardStatus(status: string): 'initiated' | 'pending' | 'confirmed' | 'failed' {
  const statusMap: Record<string, 'initiated' | 'pending' | 'confirmed' | 'failed'> = {
    'initiated': 'initiated',
    'pending': 'pending',
    'processing': 'pending',
    'confirmed': 'confirmed',
    'completed': 'confirmed',
    'successful': 'confirmed',
    'failed': 'failed',
    'cancelled': 'failed',
    'expired': 'failed',
    'rejected': 'failed'
  };

  return statusMap[status.toLowerCase()] || 'failed';
}

/**
 * Credit user wallet with USDC when payment is confirmed
 */
async function creditUserWallet(
  userId: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  transactionHash?: string
): Promise<WalletCreditResult> {
  try {
    // Get or create user wallet
    let { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', currency)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError;
    }

    // Create wallet if doesn't exist
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          currency: currency,
          balance: 0,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      wallet = newWallet;
    }

    // Calculate new balance
    const newBalance = parseFloat(wallet.balance) + amount;

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('user_wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create transaction record
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: userId,
        type: 'DEPOSIT',
        amount: amount,
        currency: currency,
        description: `Payment confirmation - ${paymentIntentId}`,
        reference: transactionHash,
        metadata: {
          payment_intent_id: paymentIntentId,
          source: 'yellowcard_webhook'
        }
      });

    console.log(`Wallet credited: ${amount} ${currency} to user ${userId}. New balance: ${newBalance}`);

    return {
      success: true,
      walletId: wallet.id,
      newBalance: newBalance
    };

  } catch (error) {
    console.error('Wallet credit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown wallet error'
    };
  }
}

/**
 * Log webhook events for admin monitoring
 */
async function logWebhookEvent(logData: {
  payment_intent_id?: string;
  webhook_type: string;
  status: string;
  payload: any;
  processed_at: string;
  wallet_credited: boolean;
  wallet_id?: string;
}) {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        payment_intent_id: logData.payment_intent_id,
        webhook_type: logData.webhook_type,
        status: logData.status,
        payload: logData.payload,
        processed_at: logData.processed_at,
        wallet_credited: logData.wallet_credited,
        wallet_id: logData.wallet_id
      });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
    // Don't fail the webhook for logging errors
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'yellowcard-webhook',
    timestamp: new Date().toISOString()
  });
} 