import { useState, useEffect, useCallback } from 'react';

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}

interface UseExchangeRatesState {
  rates: Record<string, ExchangeRate>;
  isLoading: boolean;
  error: string | null;
}

interface UseExchangeRatesReturn extends UseExchangeRatesState {
  getRate: (from: string, to: string) => number | null;
  convertAmount: (amount: number, from: string, to: string) => number | null;
  refreshRates: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'exchange_rates_cache';

export const useExchangeRates = (): UseExchangeRatesReturn => {
  const [state, setState] = useState<UseExchangeRatesState>({
    rates: {},
    isLoading: false,
    error: null
  });

  const getCachedRates = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          return rates;
        }
      }
    } catch (error) {
      console.warn('Failed to read cached exchange rates:', error);
    }
    return null;
  }, []);

  const setCachedRates = useCallback((rates: Record<string, ExchangeRate>) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache exchange rates:', error);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first
      const cachedRates = getCachedRates();
      if (cachedRates) {
        setState({
          rates: cachedRates,
          isLoading: false,
          error: null
        });
        return;
      }

      // In a real implementation, this would call your exchange rate API
      const response = await fetch('/api/exchange-rates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const ratesData = await response.json();
      
      // Transform API response to our format
      const rates: Record<string, ExchangeRate> = {};
      Object.entries(ratesData.rates || {}).forEach(([pair, rate]) => {
        const [from, to] = pair.split('_');
        if (from && to && typeof rate === 'number') {
          rates[pair] = {
            fromCurrency: from,
            toCurrency: to,
            rate,
            lastUpdated: new Date()
          };
        }
      });

      setState({
        rates,
        isLoading: false,
        error: null
      });

      setCachedRates(rates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exchange rates';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [getCachedRates, setCachedRates]);

  const getRate = useCallback((from: string, to: string): number | null => {
    if (from === to) return 1;
    
    const directKey = `${from}_${to}`;
    const reverseKey = `${to}_${from}`;
    
    if (state.rates[directKey]) {
      return state.rates[directKey].rate;
    }
    
    if (state.rates[reverseKey]) {
      return 1 / state.rates[reverseKey].rate;
    }
    
    return null;
  }, [state.rates]);

  const convertAmount = useCallback((amount: number, from: string, to: string): number | null => {
    const rate = getRate(from, to);
    if (rate === null) return null;
    return amount * rate;
  }, [getRate]);

  const refreshRates = useCallback(async () => {
    // Clear cache and fetch fresh rates
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear exchange rates cache:', error);
    }
    await fetchRates();
  }, [fetchRates]);

  // Fetch rates on mount
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    ...state,
    getRate,
    convertAmount,
    refreshRates
  };
}; 