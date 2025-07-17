/**
 * Webhook Controller for Yellow Card Integration
 * Handles secure webhook processing with signature verification
 */

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import crypto from 'crypto';

const YELLOWCARD_WEBHOOK_SECRET = process.env.YELLOWCARD_WEBHOOK_SECRET!;

interface YellowCardWebhookPayload {
  payment_id: string;
  reference: string;
  status: string;
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

export class WebhookController {
  /**
   * Process Yellow Card webhook
   */
  static async processYellowCardWebhook(req: Request, res: Response) {
    try {
      const payload: YellowCardWebhookPayload = req.body;
      const signature = req.headers['x-yellowcard-signature'] as string;
      const timestamp = req.headers['x-yellowcard-timestamp'] as string;

      // Verify webhook signature
      if (!WebhookController.verifySignature(JSON.stringify(payload), signature, timestamp)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Find matching payment intent
      const { data: paymentIntent, error: findError } = await supabase
        .from('payment_intents')
        .select('*')
        .or(`tx_hash.eq.${payload.transaction_hash},id.eq.${payload.reference}`)
        .single();

      if (findError || !paymentIntent) {
        console.error('Payment intent not found:', payload.reference);
        return res.status(404).json({ error: 'Payment intent not found' });
      }

      // Map status
      const mappedStatus = WebhookController.mapYellowCardStatus(payload.status);

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
        return res.status(500).json({ error: 'Failed to update payment' });
      }

      // Credit wallet if confirmed
      let walletResult = null;
      if (payload.status === 'confirmed' && paymentIntent.user_id) {
        walletResult = await WebhookController.creditUserWallet(
          paymentIntent.user_id,
          payload.amount,
          'USDC',
          paymentIntent.id,
          payload.transaction_hash
        );
      }

      // Log webhook event
      await WebhookController.logWebhookEvent({
        payment_intent_id: paymentIntent.id,
        webhook_type: 'yellowcard_payment',
        status: payload.status,
        payload: payload,
        wallet_credited: walletResult?.success || false,
        wallet_id: walletResult?.walletId
      });

      res.json({
        success: true,
        payment_id: paymentIntent.id,
        status: mappedStatus,
        wallet_credited: walletResult?.success || false
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Verify webhook signature
   */
  private static verifySignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      if (!YELLOWCARD_WEBHOOK_SECRET) {
        console.error('Webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', YELLOWCARD_WEBHOOK_SECRET)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

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
   * Map Yellow Card status to our enum
   */
  private static mapYellowCardStatus(status: string): 'initiated' | 'pending' | 'confirmed' | 'failed' {
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
   * Credit user wallet
   */
  private static async creditUserWallet(
    userId: string,
    amount: number,
    currency: string,
    paymentIntentId: string,
    transactionHash?: string
  ) {
    try {
      // Use the database function for safe wallet crediting
      const { data, error } = await supabase
        .rpc('credit_user_wallet', {
          p_user_id: userId,
          p_amount: amount,
          p_currency: currency,
          p_description: `Payment confirmation - ${paymentIntentId}`,
          p_reference: transactionHash
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        walletId: data,
        transactionId: data
      };

    } catch (error) {
      console.error('Wallet credit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Log webhook event
   */
  private static async logWebhookEvent(logData: {
    payment_intent_id: string;
    webhook_type: string;
    status: string;
    payload: any;
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
          wallet_credited: logData.wallet_credited,
          wallet_id: logData.wallet_id
        });
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }

  /**
   * Get webhook logs for admin
   */
  static async getWebhookLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, payment_id, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (payment_id) {
        query = query.eq('payment_intent_id', payment_id);
      }
      if (status) {
        query = query.eq('status', status);
      }

      query = query.range(offset, offset + Number(limit) - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        logs: data || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch webhook logs'
      });
    }
  }

  /**
   * Retry failed payment via webhook simulation
   */
  static async retryPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      // Get payment intent
      const { data: payment, error } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Update status to pending to retry
      const { error: updateError } = await supabase
        .from('payment_intents')
        .update({ status: 'pending' })
        .eq('id', paymentId);

      if (updateError) {
        throw updateError;
      }

      // Log retry attempt
      await WebhookController.logWebhookEvent({
        payment_intent_id: paymentId,
        webhook_type: 'admin_retry',
        status: 'retry_initiated',
        payload: { retried_by: 'admin', original_status: payment.status },
        wallet_credited: false
      });

      res.json({
        success: true,
        message: 'Payment retry initiated',
        payment_id: paymentId,
        new_status: 'pending'
      });

    } catch (error) {
      console.error('Payment retry error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retry payment'
      });
    }
  }
}

export default WebhookController; 