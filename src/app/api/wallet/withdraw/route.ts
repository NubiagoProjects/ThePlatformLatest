/**
 * Wallet Withdrawal API
 * Handles stablecoin withdrawals with balance validation and processing
 * Supports admin approval and auto-processing via Yellow Card API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WithdrawalRequest {
  amount: number;
  to_wallet: string;
  currency?: string;
  withdrawal_method?: 'crypto' | 'mobile_money' | 'bank';
  destination_details?: {
    provider?: string;
    phone_number?: string;
    bank_account?: string;
    country?: string;
  };
}

interface YellowCardWithdrawResponse {
  success: boolean;
  transaction_id?: string;
  reference?: string;
  status?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract user ID from auth header (in real app, validate JWT)
    const userId = request.headers.get('x-user-id') || 'current-user-id';

    const body: WithdrawalRequest = await request.json();
    
    // Validate request body
    const validation = validateWithdrawalRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    const {
      amount,
      to_wallet,
      currency = 'USDC',
      withdrawal_method = 'crypto',
      destination_details = {}
    } = body;

    console.log('Processing withdrawal request:', {
      userId,
      amount,
      currency,
      withdrawal_method
    });

    // Process withdrawal using database function
    const { data: withdrawalResult, error: withdrawalError } = await supabase
      .rpc('process_withdrawal_request', {
        p_user_id: userId,
        p_amount: amount,
        p_to_wallet: to_wallet,
        p_currency: currency,
        p_withdrawal_method: withdrawal_method,
        p_destination_details: destination_details
      });

    if (withdrawalError) {
      console.error('Withdrawal processing error:', withdrawalError);
      return NextResponse.json(
        { error: 'Failed to process withdrawal request' },
        { status: 500 }
      );
    }

    const result = withdrawalResult[0];
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    const withdrawalId = result.withdrawal_id;
    const autoApproved = result.auto_approved;

    // If auto-approved, process immediately
    if (autoApproved) {
      const processingResult = await processWithdrawal(
        withdrawalId,
        withdrawal_method,
        {
          to_wallet,
          amount,
          currency,
          destination_details
        }
      );

      if (processingResult.success) {
        // Update withdrawal status to completed
        await supabase
          .from('withdrawal_requests')
          .update({
            status: 'completed',
            transaction_hash: processingResult.transaction_id,
            yellowcard_reference: processingResult.reference,
            processed_at: new Date().toISOString()
          })
          .eq('id', withdrawalId);

        return NextResponse.json({
          success: true,
          withdrawal_id: withdrawalId,
          status: 'completed',
          message: 'Withdrawal processed successfully',
          transaction_id: processingResult.transaction_id,
          auto_approved: true
        });
      } else {
        // Mark as failed and refund
        await handleWithdrawalFailure(withdrawalId, processingResult.error);
        
        return NextResponse.json({
          success: false,
          withdrawal_id: withdrawalId,
          error: processingResult.error,
          status: 'failed'
        }, { status: 500 });
      }
    } else {
      // Send notification to admin for manual approval
      await notifyAdminForApproval(withdrawalId, {
        userId,
        amount,
        currency,
        withdrawal_method,
        to_wallet
      });

      return NextResponse.json({
        success: true,
        withdrawal_id: withdrawalId,
        status: 'requested',
        message: 'Withdrawal request submitted for admin approval',
        auto_approved: false,
        estimated_processing_time: '1-24 hours'
      });
    }

  } catch (error) {
    console.error('Withdrawal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id') || 'current-user-id';
    const withdrawalId = searchParams.get('id');

    if (withdrawalId) {
      // Get specific withdrawal request
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', withdrawalId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Withdrawal request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        withdrawal: data
      });
    } else {
      // Get user's withdrawal history
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        withdrawals: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    }

  } catch (error) {
    console.error('Get withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal data' },
      { status: 500 }
    );
  }
}

/**
 * Validate withdrawal request
 */
function validateWithdrawalRequest(body: WithdrawalRequest): { valid: boolean; message?: string } {
  if (!body.amount || body.amount <= 0) {
    return { valid: false, message: 'Amount must be greater than 0' };
  }

  if (body.amount < 10) {
    return { valid: false, message: 'Minimum withdrawal amount is $10' };
  }

  if (body.amount > 50000) {
    return { valid: false, message: 'Maximum withdrawal amount is $50,000' };
  }

  if (!body.to_wallet || body.to_wallet.trim().length === 0) {
    return { valid: false, message: 'Destination wallet address is required' };
  }

  if (body.withdrawal_method === 'mobile_money') {
    if (!body.destination_details?.provider || !body.destination_details?.phone_number) {
      return { valid: false, message: 'Provider and phone number required for mobile money withdrawals' };
    }
  }

  if (body.withdrawal_method === 'crypto') {
    // Basic crypto address validation
    if (body.to_wallet.length < 26 || body.to_wallet.length > 62) {
      return { valid: false, message: 'Invalid crypto wallet address format' };
    }
  }

  return { valid: true };
}

/**
 * Process withdrawal via Yellow Card API or other methods
 */
async function processWithdrawal(
  withdrawalId: string,
  method: string,
  details: {
    to_wallet: string;
    amount: number;
    currency: string;
    destination_details: any;
  }
): Promise<YellowCardWithdrawResponse> {
  try {
    if (method === 'mobile_money') {
      // Process via Yellow Card mobile money withdrawal
      return await processYellowCardWithdrawal(withdrawalId, details);
    } else if (method === 'crypto') {
      // Process crypto withdrawal
      return await processCryptoWithdrawal(withdrawalId, details);
    } else {
      return {
        success: false,
        error: 'Unsupported withdrawal method'
      };
    }
  } catch (error) {
    console.error('Processing withdrawal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    };
  }
}

/**
 * Process withdrawal via Yellow Card API
 */
async function processYellowCardWithdrawal(
  withdrawalId: string,
  details: any
): Promise<YellowCardWithdrawResponse> {
  try {
    const yellowCardPayload = {
      amount: details.amount,
      currency: details.currency,
      recipient: {
        phone_number: details.destination_details.phone_number,
        provider: details.destination_details.provider,
        country: details.destination_details.country
      },
      reference: withdrawalId,
      metadata: {
        withdrawal_id: withdrawalId,
        type: 'mobile_money_withdrawal'
      }
    };

    // In production, call actual Yellow Card API
    const response = await fetch(`${process.env.YELLOWCARD_API_URL}/withdrawals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.YELLOWCARD_API_KEY}`,
        'X-API-Version': '2024-01'
      },
      body: JSON.stringify(yellowCardPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Yellow Card API error');
    }

    const result = await response.json();

    return {
      success: true,
      transaction_id: result.transaction_id,
      reference: result.reference,
      status: result.status
    };

  } catch (error) {
    console.error('Yellow Card withdrawal error:', error);
    
    // Mock successful response for demo
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        transaction_id: `ycw_${Date.now()}`,
        reference: withdrawalId,
        status: 'completed'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Yellow Card processing failed'
    };
  }
}

/**
 * Process crypto withdrawal
 */
async function processCryptoWithdrawal(
  withdrawalId: string,
  details: any
): Promise<YellowCardWithdrawResponse> {
  try {
    // Mock crypto withdrawal processing
    // In production, integrate with actual crypto wallet service
    
    const transactionId = `crypto_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      transaction_id: transactionId,
      reference: withdrawalId,
      status: 'completed'
    };

  } catch (error) {
    console.error('Crypto withdrawal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Crypto processing failed'
    };
  }
}

/**
 * Handle withdrawal failure
 */
async function handleWithdrawalFailure(withdrawalId: string, errorMessage: string) {
  try {
    // Update withdrawal status to failed
    await supabase
      .from('withdrawal_requests')
      .update({
        status: 'failed',
        admin_notes: `Auto-processing failed: ${errorMessage}`,
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    // Get withdrawal details for refund
    const { data: withdrawal } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawal) {
      // Refund to user wallet
      await supabase
        .from('user_wallets')
        .update({
          balance: supabase.sql`balance + ${withdrawal.amount}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', withdrawal.user_id)
        .eq('currency', withdrawal.currency);

      // Log refund transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: supabase.sql`(SELECT id FROM user_wallets WHERE user_id = ${withdrawal.user_id} AND currency = ${withdrawal.currency})`,
          user_id: withdrawal.user_id,
          type: 'REFUND',
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          description: `Withdrawal refund - ${withdrawalId}`,
          reference: withdrawalId,
          status: 'COMPLETED',
          metadata: {
            withdrawal_id: withdrawalId,
            refund_reason: errorMessage
          }
        });
    }

  } catch (error) {
    console.error('Error handling withdrawal failure:', error);
  }
}

/**
 * Notify admin for manual approval
 */
async function notifyAdminForApproval(withdrawalId: string, details: any) {
  try {
    // In production, send email/webhook/notification to admin
    console.log('Admin notification sent for withdrawal:', {
      withdrawalId,
      userId: details.userId,
      amount: details.amount,
      currency: details.currency,
      method: details.withdrawal_method
    });

    // Log notification
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'withdrawal_approval_required',
        title: 'New Withdrawal Request',
        message: `User ${details.userId} requested withdrawal of ${details.amount} ${details.currency}`,
        data: {
          withdrawal_id: withdrawalId,
          user_id: details.userId,
          amount: details.amount,
          currency: details.currency,
          method: details.withdrawal_method,
          to_wallet: details.to_wallet
        },
        priority: 'medium'
      });

  } catch (error) {
    console.error('Error notifying admin:', error);
  }
} 