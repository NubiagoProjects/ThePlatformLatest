/**
 * Withdrawal Form Component
 * UI to withdraw stablecoins with admin approval or auto-processing
 * Supports crypto and mobile money withdrawals
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  Wallet, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Info,
  Shield,
  Clock,
  Smartphone,
  CreditCard,
  ArrowRight,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserWallet {
  id: string;
  balance: number;
  currency: string;
}

interface WithdrawalLimits {
  daily_used: number;
  daily_limit: number;
  monthly_used: number;
  monthly_limit: number;
  can_withdraw: boolean;
  reason?: string;
}

interface WithdrawalFormProps {
  onSuccess?: (withdrawalId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface DestinationDetails {
  provider?: string;
  phone_number?: string;
  bank_account?: string;
  country?: string;
}

export default function WithdrawalForm({ onSuccess, onError, className = '' }: WithdrawalFormProps) {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [withdrawalLimits, setWithdrawalLimits] = useState<WithdrawalLimits | null>(null);
  const [amount, setAmount] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'crypto' | 'mobile_money' | 'bank'>('crypto');
  const [destinationDetails, setDestinationDetails] = useState<DestinationDetails>({});
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);

  // Mock user ID - in real app, get from auth context
  const userId = 'current-user-id';

  // Calculate fees when amount or method changes
  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    let feePercentage = 0;
    
    switch (withdrawalMethod) {
      case 'crypto':
        feePercentage = 0.02; // 2%
        break;
      case 'mobile_money':
        feePercentage = 0.03; // 3%
        break;
      case 'bank':
        feePercentage = 0.025; // 2.5%
        break;
    }
    
    const fee = amt * feePercentage;
    const net = amt - fee;
    
    setEstimatedFee(fee);
    setNetAmount(net);
  }, [amount, withdrawalMethod]);

  const loadWalletData = useCallback(async () => {
    try {
      // Load wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency', 'USDC')
        .eq('is_active', true)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      setWallet(walletData || { id: '', balance: 0, currency: 'USDC' });

      // Load withdrawal limits
      if (walletData) {
        await checkWithdrawalLimits(0); // Check limits with 0 amount initially
      }

    } catch (error) {
      console.error('Error loading wallet data:', error);
      if (onError) {
        onError('Failed to load wallet information');
      }
    }
  }, [userId, onError]);

  // Load user wallet and limits
  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const checkWithdrawalLimits = async (requestAmount: number) => {
    try {
      const { data, error } = await supabase
        .rpc('check_withdrawal_limits', {
          p_user_id: userId,
          p_amount: requestAmount
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setWithdrawalLimits(data[0]);
      }
    } catch (error) {
      console.error('Error checking withdrawal limits:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const amt = parseFloat(amount);

    if (!amount || amt <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (amt < 10) {
      errors.amount = 'Minimum withdrawal amount is $10';
    } else if (amt > 50000) {
      errors.amount = 'Maximum withdrawal amount is $50,000';
    } else if (wallet && amt > wallet.balance) {
      errors.amount = 'Insufficient wallet balance';
    }

    if (!toWallet.trim()) {
      if (withdrawalMethod === 'crypto') {
        errors.toWallet = 'Wallet address is required';
      } else if (withdrawalMethod === 'mobile_money') {
        errors.toWallet = 'Phone number is required';
      } else {
        errors.toWallet = 'Destination is required';
      }
    }

    if (withdrawalMethod === 'mobile_money') {
      if (!destinationDetails.provider) {
        errors.provider = 'Mobile money provider is required';
      }
      if (!destinationDetails.country) {
        errors.country = 'Country is required';
      }
    }

    if (withdrawalMethod === 'crypto') {
      // Basic crypto address validation
      if (toWallet.length < 26 || toWallet.length > 62) {
        errors.toWallet = 'Invalid wallet address format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const amt = parseFloat(amount);
    
    // Check withdrawal limits
    await checkWithdrawalLimits(amt);
    if (withdrawalLimits && !withdrawalLimits.can_withdraw) {
      setValidationErrors({ amount: withdrawalLimits.reason || 'Withdrawal limit exceeded' });
      return;
    }

    setLoading(true);

    try {
      const withdrawalData = {
        amount: amt,
        to_wallet: toWallet,
        currency: 'USDC',
        withdrawal_method: withdrawalMethod,
        destination_details: withdrawalMethod === 'mobile_money' 
          ? {
              provider: destinationDetails.provider,
              phone_number: toWallet,
              country: destinationDetails.country
            }
          : withdrawalMethod === 'bank'
          ? {
              bank_account: toWallet,
              country: destinationDetails.country
            }
          : {}
      };

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify(withdrawalData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal request failed');
      }

      if (onSuccess) {
        onSuccess(result.withdrawal_id);
      }

      // Reset form
      setAmount('');
      setToWallet('');
      setDestinationDetails({});
      
      // Reload wallet data
      await loadWalletData();

    } catch (error) {
      console.error('Withdrawal error:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getWithdrawalMethodIcon = (method: string) => {
    switch (method) {
      case 'crypto': return <Wallet className="w-5 h-5" />;
      case 'mobile_money': return <Smartphone className="w-5 h-5" />;
      case 'bank': return <CreditCard className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const getEstimatedProcessingTime = () => {
    switch (withdrawalMethod) {
      case 'crypto': return '5-30 minutes';
      case 'mobile_money': return '1-5 minutes';
      case 'bank': return '1-3 business days';
      default: return 'Varies';
    }
  };

  const isAutoApprovalEligible = () => {
    const amt = parseFloat(amount) || 0;
    return amt <= 500 && withdrawalMethod === 'crypto';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Withdraw Funds</h2>
            <p className="text-green-100 text-sm">Send your stablecoins to external wallets</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Wallet Balance */}
        {wallet && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${wallet.balance.toFixed(2)} {wallet.currency}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Limits */}
        {withdrawalLimits && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Withdrawal Limits</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Daily: ${withdrawalLimits.daily_used.toFixed(2)} / ${withdrawalLimits.daily_limit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-700">Monthly: ${withdrawalLimits.monthly_used.toFixed(2)} / ${withdrawalLimits.monthly_limit.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Withdrawal Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'crypto', label: 'Crypto Wallet', icon: 'wallet', fee: '2%' },
              { value: 'mobile_money', label: 'Mobile Money', icon: 'smartphone', fee: '3%' },
              { value: 'bank', label: 'Bank Transfer', icon: 'credit-card', fee: '2.5%' }
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => {
                  setWithdrawalMethod(method.value as any);
                  setValidationErrors({});
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  withdrawalMethod === method.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getWithdrawalMethodIcon(method.value)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{method.label}</p>
                    <p className="text-sm text-gray-500">Fee: {method.fee}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Amount (USDC)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setValidationErrors(prev => ({ ...prev, amount: '' }));
              }}
              placeholder="Enter withdrawal amount"
              min="10"
              max="50000"
              step="0.01"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                validationErrors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {validationErrors.amount && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            )}
          </div>
          {validationErrors.amount && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.amount}</p>
          )}
          
          {/* Quick amount buttons */}
          <div className="flex space-x-2 mt-2">
            {[25, 50, 100, 250].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                disabled={loading}
              >
                ${quickAmount}
              </button>
            ))}
            {wallet && (
              <button
                type="button"
                onClick={() => setAmount(wallet.balance.toString())}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                disabled={loading}
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {withdrawalMethod === 'crypto' && 'Wallet Address'}
            {withdrawalMethod === 'mobile_money' && 'Phone Number'}
            {withdrawalMethod === 'bank' && 'Bank Account'}
          </label>
          <div className="relative">
            <input
              type={withdrawalMethod === 'crypto' ? 'text' : 'text'}
              value={toWallet}
              onChange={(e) => {
                setToWallet(e.target.value);
                setValidationErrors(prev => ({ ...prev, toWallet: '' }));
              }}
              placeholder={
                withdrawalMethod === 'crypto' 
                  ? 'Enter destination wallet address' 
                  : withdrawalMethod === 'mobile_money'
                  ? 'Enter mobile money number'
                  : 'Enter bank account details'
              }
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                validationErrors.toWallet ? 'border-red-500' : 'border-gray-300'
              } ${withdrawalMethod === 'crypto' && !showWalletAddress ? 'font-mono' : ''}`}
              disabled={loading}
            />
            {withdrawalMethod === 'crypto' && toWallet && (
              <button
                type="button"
                onClick={() => setShowWalletAddress(!showWalletAddress)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showWalletAddress ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
          </div>
          {validationErrors.toWallet && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.toWallet}</p>
          )}
        </div>

        {/* Mobile Money Details */}
        {withdrawalMethod === 'mobile_money' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={destinationDetails.provider || ''}
                onChange={(e) => setDestinationDetails(prev => ({ ...prev, provider: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  validationErrors.provider ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select provider</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="MTN MoMo">MTN MoMo</option>
                <option value="Orange Money">Orange Money</option>
              </select>
              {validationErrors.provider && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.provider}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                value={destinationDetails.country || ''}
                onChange={(e) => setDestinationDetails(prev => ({ ...prev, country: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  validationErrors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select country</option>
                <option value="KE">Kenya</option>
                <option value="UG">Uganda</option>
                <option value="TZ">Tanzania</option>
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
              </select>
              {validationErrors.country && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.country}</p>
              )}
            </div>
          </div>
        )}

        {/* Fee Breakdown */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Transaction Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Withdrawal Amount</span>
                <span className="font-medium">${parseFloat(amount).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-medium">-${estimatedFee.toFixed(2)} USDC</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-base font-semibold">
                  <span>You'll Receive</span>
                  <span>${netAmount.toFixed(2)} USDC</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Info */}
        {amount && parseFloat(amount) > 0 && (
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Processing Information</p>
              <p className="text-blue-700 mt-1">
                {isAutoApprovalEligible() 
                  ? `✓ Auto-approved - Processing time: ${getEstimatedProcessingTime()}`
                  : `⏳ Requires admin approval - Processing time: 1-24 hours + ${getEstimatedProcessingTime()}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !amount || !toWallet || parseFloat(amount) <= 0}
          className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing Withdrawal...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Withdraw ${netAmount.toFixed(2)} USDC
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="flex items-start space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <Shield className="w-4 h-4 text-green-600 mt-0.5" />
          <p>
            Withdrawals are secured with multi-signature verification. 
            Double-check your destination address before confirming as transactions cannot be reversed.
          </p>
        </div>
      </form>
    </div>
  );
} 