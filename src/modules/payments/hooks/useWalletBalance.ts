import { useState, useEffect, useCallback } from 'react';

export interface WalletBalance {
  amount: number;
  currency: string;
  lastUpdated: Date;
}

interface UseWalletBalanceState {
  balance: WalletBalance | null;
  isLoading: boolean;
  error: string | null;
}

interface UseWalletBalanceReturn extends UseWalletBalanceState {
  refreshBalance: () => Promise<void>;
  canAfford: (amount: number) => boolean;
}

export const useWalletBalance = (): UseWalletBalanceReturn => {
  const [state, setState] = useState<UseWalletBalanceState>({
    balance: null,
    isLoading: false,
    error: null
  });

  const fetchBalance = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, this would call your wallet API
      const response = await fetch('/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }

      const balanceData = await response.json();
      
      setState({
        balance: {
          amount: balanceData.amount || 0,
          currency: balanceData.currency || 'USD',
          lastUpdated: new Date()
        },
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  const canAfford = useCallback((amount: number): boolean => {
    if (!state.balance) return false;
    return state.balance.amount >= amount;
  }, [state.balance]);

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    refreshBalance,
    canAfford
  };
}; 