import { useState, useCallback } from 'react';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
  metadata?: Record<string, any>;
}

interface UsePaymentIntentState {
  intent: PaymentIntent | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePaymentIntentReturn extends UsePaymentIntentState {
  createIntent: (amount: number, currency: string, metadata?: Record<string, any>) => Promise<PaymentIntent | null>;
  confirmIntent: (intentId: string, paymentMethod: any) => Promise<boolean>;
  cancelIntent: (intentId: string) => Promise<boolean>;
  clearIntent: () => void;
}

export const usePaymentIntent = (): UsePaymentIntentReturn => {
  const [state, setState] = useState<UsePaymentIntentState>({
    intent: null,
    isLoading: false,
    error: null
  });

  const createIntent = useCallback(async (
    amount: number, 
    currency: string, 
    metadata?: Record<string, any>
  ): Promise<PaymentIntent | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, this would call your payment API
      const response = await fetch('/api/payments/intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, currency, metadata })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const intent = await response.json();
      
      setState({
        intent,
        isLoading: false,
        error: null
      });

      return intent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return null;
    }
  }, []);

  const confirmIntent = useCallback(async (
    intentId: string, 
    paymentMethod: any
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/payments/intents/${intentId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMethod })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment intent');
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        intent: result.intent || prev.intent,
        isLoading: false,
        error: null
      }));

      return result.success || false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  const cancelIntent = useCallback(async (intentId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/payments/intents/${intentId}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel payment intent');
      }

      setState(prev => ({
        ...prev,
        intent: prev.intent ? { ...prev.intent, status: 'canceled' } : null,
        isLoading: false,
        error: null
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  const clearIntent = useCallback(() => {
    setState({
      intent: null,
      isLoading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    createIntent,
    confirmIntent,
    cancelIntent,
    clearIntent
  };
}; 