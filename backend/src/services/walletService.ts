import { supabaseAdmin } from '../config/supabase';
import { YellowCardAPI, createYellowCardClient } from '../../../src/lib/yellowcard';

interface WalletBalance {
  currency: string;
  balance: number;
  lockedBalance: number;
  available: number;
}

interface TransactionParams {
  userId: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'REFUND' | 'CONVERSION' | 'TRANSFER';
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  metadata?: any;
}

interface TransferParams {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: any;
}

interface ConversionParams {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  exchangeRate: number;
  description?: string;
}

export class WalletService {
  private static yellowCardClient: YellowCardAPI;

  static {
    // Initialize Yellow Card client
    this.yellowCardClient = createYellowCardClient({
      apiKey: process.env.YELLOWCARD_API_KEY || '',
      secretKey: process.env.YELLOWCARD_SECRET_KEY || '',
      baseURL: process.env.YELLOWCARD_BASE_URL || 'https://api-sandbox.yellowcard.io',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
      webhookSecret: process.env.YELLOWCARD_WEBHOOK_SECRET || ''
    });
  }

  /**
   * Create or get user wallet for a specific currency
   */
  static async createOrGetWallet(userId: string, currency: string): Promise<any> {
    try {
      // Check if wallet exists
      const { data: existingWallet, error: fetchError } = await supabaseAdmin
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (existingWallet) {
        return existingWallet;
      }

      // Create new wallet if it doesn't exist
      if (fetchError?.code === 'PGRST116') { // No rows returned
        const { data: newWallet, error: createError } = await supabaseAdmin
          .from('user_wallets')
          .insert({
            user_id: userId,
            currency,
            balance: 0,
            locked_balance: 0,
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return newWallet;
      }

      throw fetchError;
    } catch (error) {
      console.error('Error creating/getting wallet:', error);
      throw error;
    }
  }

  /**
   * Get all wallets for a user
   */
  static async getUserWallets(userId: string): Promise<any[]> {
    try {
      const { data: wallets, error } = await supabaseAdmin
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return wallets || [];
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance for a specific currency
   */
  static async getWalletBalance(userId: string, currency: string): Promise<WalletBalance> {
    try {
      const wallet = await this.createOrGetWallet(userId, currency);
      
      return {
        currency,
        balance: parseFloat(wallet.balance.toString()),
        lockedBalance: parseFloat(wallet.locked_balance.toString()),
        available: parseFloat(wallet.balance.toString()) - parseFloat(wallet.locked_balance.toString())
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get all wallet balances for a user
   */
  static async getAllWalletBalances(userId: string): Promise<WalletBalance[]> {
    try {
      const wallets = await this.getUserWallets(userId);
      
      return wallets.map(wallet => ({
        currency: wallet.currency,
        balance: parseFloat(wallet.balance.toString()),
        lockedBalance: parseFloat(wallet.locked_balance.toString()),
        available: parseFloat(wallet.balance.toString()) - parseFloat(wallet.locked_balance.toString())
      }));
    } catch (error) {
      console.error('Error getting all wallet balances:', error);
      throw error;
    }
  }

  /**
   * Add funds to wallet (from successful payment)
   */
  static async addFunds(userId: string, currency: string, amount: number, description: string, reference?: string): Promise<any> {
    try {
      const wallet = await this.createOrGetWallet(userId, currency);
      const previousBalance = parseFloat(wallet.balance.toString());
      const newBalance = previousBalance + amount;

      // Update wallet balance
      const { error: updateError } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) {
        throw updateError;
      }

      // Create transaction record
      const transaction = await this.createTransaction({
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        currency,
        description,
        reference: reference || this.generateTransactionReference()
      });

      return {
        wallet: { ...wallet, balance: newBalance },
        transaction,
        previousBalance,
        newBalance
      };
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  /**
   * Deduct funds from wallet (for payments/withdrawals)
   */
  static async deductFunds(userId: string, currency: string, amount: number, description: string, reference?: string): Promise<any> {
    try {
      const wallet = await this.createOrGetWallet(userId, currency);
      const previousBalance = parseFloat(wallet.balance.toString());
      
      if (previousBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = previousBalance - amount;

      // Update wallet balance
      const { error: updateError } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) {
        throw updateError;
      }

      // Create transaction record
      const transaction = await this.createTransaction({
        userId,
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: -amount, // Negative for deduction
        currency,
        description,
        reference: reference || this.generateTransactionReference()
      });

      return {
        wallet: { ...wallet, balance: newBalance },
        transaction,
        previousBalance,
        newBalance
      };
    } catch (error) {
      console.error('Error deducting funds:', error);
      throw error;
    }
  }

  /**
   * Lock funds for pending transactions
   */
  static async lockFunds(userId: string, currency: string, amount: number): Promise<boolean> {
    try {
      const wallet = await this.createOrGetWallet(userId, currency);
      const availableBalance = parseFloat(wallet.balance.toString()) - parseFloat(wallet.locked_balance.toString());
      
      if (availableBalance < amount) {
        return false; // Insufficient funds
      }

      const { error } = await supabaseAdmin
        .from('user_wallets')
        .update({
          locked_balance: parseFloat(wallet.locked_balance.toString()) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error locking funds:', error);
      throw error;
    }
  }

  /**
   * Unlock funds (release locked funds)
   */
  static async unlockFunds(userId: string, currency: string, amount: number, addToBalance: boolean = true): Promise<boolean> {
    try {
      const wallet = await this.createOrGetWallet(userId, currency);
      const currentLocked = parseFloat(wallet.locked_balance.toString());
      
      if (currentLocked < amount) {
        return false; // Not enough locked funds
      }

      const newLockedBalance = currentLocked - amount;
      const newBalance = addToBalance 
        ? parseFloat(wallet.balance.toString()) + amount 
        : parseFloat(wallet.balance.toString());

      const { error } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
          locked_balance: newLockedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error unlocking funds:', error);
      throw error;
    }
  }

  /**
   * Transfer funds between users
   */
  static async transferFunds(params: TransferParams): Promise<any> {
    const { fromUserId, toUserId, amount, currency, description, metadata } = params;

    try {
      // Get sender wallet
      const senderWallet = await this.createOrGetWallet(fromUserId, currency);
      const senderBalance = parseFloat(senderWallet.balance.toString());
      
      if (senderBalance < amount) {
        throw new Error('Insufficient balance for transfer');
      }

      // Get receiver wallet
      const receiverWallet = await this.createOrGetWallet(toUserId, currency);

      const reference = this.generateTransactionReference();

      // Deduct from sender
      await this.deductFunds(fromUserId, currency, amount, `Transfer to user ${toUserId}: ${description}`, reference);

      // Add to receiver
      await this.addFunds(toUserId, currency, amount, `Transfer from user ${fromUserId}: ${description}`, reference);

      return {
        success: true,
        reference,
        amount,
        currency,
        fromUserId,
        toUserId
      };
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  }

  /**
   * Convert between currencies
   */
  static async convertCurrency(params: ConversionParams): Promise<any> {
    const { userId, fromCurrency, toCurrency, amount, exchangeRate, description } = params;

    try {
      const convertedAmount = amount * exchangeRate;
      const reference = this.generateTransactionReference();

      // Deduct from source currency
      await this.deductFunds(userId, fromCurrency, amount, `Conversion to ${toCurrency}: ${description}`, reference);

      // Add to target currency
      await this.addFunds(userId, toCurrency, convertedAmount, `Conversion from ${fromCurrency}: ${description}`, reference);

      // Create conversion record
      const { data: conversion, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'CONVERSION',
          amount: convertedAmount,
          currency: toCurrency,
          balance_before: 0,
          balance_after: convertedAmount,
          description: `Currency conversion: ${amount} ${fromCurrency} → ${convertedAmount} ${toCurrency}`,
          reference,
          metadata: {
            fromCurrency,
            toCurrency,
            sourceAmount: amount,
            targetAmount: convertedAmount,
            exchangeRate
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        conversion,
        reference,
        sourceAmount: amount,
        targetAmount: convertedAmount,
        exchangeRate
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Create transaction record
   */
  static async createTransaction(params: TransactionParams): Promise<any> {
    try {
      const { userId, walletId, type, amount, currency, description, reference, metadata } = params;

      // Get current wallet balance for accurate before/after tracking
      const { data: wallet } = await supabaseAdmin
        .from('user_wallets')
        .select('balance')
        .eq('id', walletId)
        .single();

      const currentBalance = wallet ? parseFloat(wallet.balance.toString()) : 0;
      const balanceBefore = type === 'DEPOSIT' ? currentBalance - amount : currentBalance + Math.abs(amount);
      const balanceAfter = currentBalance;

      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          type,
          amount: Math.abs(amount),
          currency,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description,
          reference: reference || this.generateTransactionReference(),
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(userId: string, options: {
    limit?: number;
    offset?: number;
    currency?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ transactions: any[]; total: number }> {
    try {
      const { limit = 20, offset = 0, currency, type, startDate, endDate } = options;

      let query = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          user_wallets (
            currency
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (currency) {
        query = query.eq('currency', currency);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: transactions, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        transactions: transactions || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get wallet statistics
   */
  static async getWalletStats(userId: string): Promise<any> {
    try {
      const wallets = await this.getAllWalletBalances(userId);
      
      // Get transaction counts by type
      const { data: transactionStats, error } = await supabaseAdmin
        .from('transactions')
        .select('type, currency, amount')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const stats = {
        totalWallets: wallets.length,
        activeWallets: wallets.filter(w => w.balance > 0).length,
        totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
        totalLocked: wallets.reduce((sum, w) => sum + w.lockedBalance, 0),
        transactionCounts: {
          DEPOSIT: 0,
          WITHDRAWAL: 0,
          PURCHASE: 0,
          REFUND: 0,
          CONVERSION: 0,
          TRANSFER: 0
        },
        currencyBreakdown: wallets.reduce((acc, wallet) => {
          acc[wallet.currency] = wallet.balance;
          return acc;
        }, {} as Record<string, number>)
      };

      // Count transactions by type
      transactionStats?.forEach(tx => {
        if (stats.transactionCounts[tx.type as keyof typeof stats.transactionCounts] !== undefined) {
          stats.transactionCounts[tx.type as keyof typeof stats.transactionCounts]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting wallet stats:', error);
      throw error;
    }
  }

  /**
   * Validate transaction
   */
  static async validateTransaction(userId: string, currency: string, amount: number, type: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    try {
      if (amount <= 0) {
        return { valid: false, reason: 'Amount must be positive' };
      }

      if (type === 'WITHDRAWAL' || type === 'PURCHASE') {
        const balance = await this.getWalletBalance(userId, currency);
        
        if (balance.available < amount) {
          return { valid: false, reason: 'Insufficient balance' };
        }
      }

      // Check daily limits (if implemented)
      const dailyLimit = await this.getDailyTransactionLimit(userId);
      const todayTotal = await this.getTodayTransactionTotal(userId);
      
      if (todayTotal + amount > dailyLimit) {
        return { valid: false, reason: 'Daily transaction limit exceeded' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating transaction:', error);
      return { valid: false, reason: 'Validation failed' };
    }
  }

  /**
   * Get daily transaction limit for user
   */
  static async getDailyTransactionLimit(userId: string): Promise<number> {
    try {
      // Get user KYC level and return appropriate limit
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('role, created_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return 100; // Default limit for unverified users
      }

      // Return limits based on user level
      switch (user.role) {
        case 'ADMIN':
          return 1000000; // No practical limit for admin
        case 'SUPPLIER':
          return 50000; // Higher limit for suppliers
        default:
          return 5000; // Standard limit for users
      }
    } catch (error) {
      console.error('Error getting daily limit:', error);
      return 100; // Conservative default
    }
  }

  /**
   * Get today's transaction total for user
   */
  static async getTodayTransactionTotal(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .in('type', ['WITHDRAWAL', 'PURCHASE'])
        .gte('created_at', today.toISOString());

      if (error) {
        throw error;
      }

      return transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0) || 0;
    } catch (error) {
      console.error('Error getting today total:', error);
      return 0;
    }
  }

  /**
   * Generate unique transaction reference
   */
  static generateTransactionReference(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Cleanup expired locks (utility function)
   */
  static async cleanupExpiredLocks(): Promise<void> {
    try {
      // This would be called by a cron job to release locks older than X minutes
      const expiredTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
      await supabaseAdmin
        .from('user_wallets')
        .update({ locked_balance: 0 })
        .lt('updated_at', expiredTime.toISOString())
        .gt('locked_balance', 0);

      console.log('Expired wallet locks cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
    }
  }
}

export default WalletService; 