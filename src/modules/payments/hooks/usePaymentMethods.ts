'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaymentMethod, Country, UsePaymentMethodsReturn } from '../types';
import { paymentAPI } from '../services/paymentAPI';
import { useCountryDetection } from './useCountryDetection';

/**
 * Hook for managing payment methods
 * Provides filtering by country, provider type, and amount limits
 */
export const usePaymentMethods = (): UsePaymentMethodsReturn => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { detectedCountry } = useCountryDetection();

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async (countryCode?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentAPI.getPaymentMethods(countryCode);
      
      if (response.success && response.data) {
        setPaymentMethods(response.data.paymentMethods || []);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch payment methods');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment methods';
      setError(errorMessage);
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPaymentMethods(detectedCountry?.code);
  }, [fetchPaymentMethods, detectedCountry?.code]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchPaymentMethods(detectedCountry?.code);
  }, [fetchPaymentMethods, detectedCountry?.code]);

  // Filter methods by country
  const getMethodsByCountry = useCallback((countryCode: string): PaymentMethod[] => {
    return paymentMethods.filter(method => 
      method.countryCode === countryCode && method.isActive
    );
  }, [paymentMethods]);

  // Find method by provider
  const getMethodByProvider = useCallback((provider: string): PaymentMethod | null => {
    return paymentMethods.find(method => 
      method.provider === provider && method.isActive
    ) || null;
  }, [paymentMethods]);

  // Filter methods by type
  const getMethodsByType = useCallback((type: string): PaymentMethod[] => {
    return paymentMethods.filter(method => 
      method.type === type && method.isActive
    );
  }, [paymentMethods]);

  // Filter methods by amount
  const getMethodsByAmount = useCallback((amount: number, countryCode?: string): PaymentMethod[] => {
    return paymentMethods.filter(method => {
      if (!method.isActive) return false;
      if (countryCode && method.countryCode !== countryCode) return false;
      if (amount < method.minAmount) return false;
      if (method.maxAmount && amount > method.maxAmount) return false;
      return true;
    });
  }, [paymentMethods]);

  // Get Yellow Card methods
  const getYellowCardMethods = useCallback((countryCode?: string): PaymentMethod[] => {
    return paymentMethods.filter(method => 
      method.type === 'YELLOWCARD' && 
      method.isActive &&
      (!countryCode || method.countryCode === countryCode)
    );
  }, [paymentMethods]);

  // Get Mobile Money methods
  const getMobileMoneyMethods = useCallback((countryCode?: string): PaymentMethod[] => {
    return paymentMethods.filter(method => 
      method.type === 'MOBILE_MONEY' && 
      method.isActive &&
      (!countryCode || method.countryCode === countryCode)
    );
  }, [paymentMethods]);

  // Check if method supports amount
  const isAmountSupported = useCallback((methodId: string, amount: number): boolean => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return false;
    
    if (amount < method.minAmount) return false;
    if (method.maxAmount && amount > method.maxAmount) return false;
    
    return true;
  }, [paymentMethods]);

  // Calculate fees for a method
  const calculateFees = useCallback((methodId: string, amount: number): number => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return 0;
    
    const percentageFee = (amount * method.feePercentage) / 100;
    const totalFee = percentageFee + method.feeFixed;
    
    return totalFee;
  }, [paymentMethods]);

  // Get processing time estimate
  const getProcessingTime = useCallback((methodId: string): number => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.processingTimeMinutes || 15;
  }, [paymentMethods]);

  // Group methods by type
  const groupedMethods = useMemo(() => {
    const groups: Record<string, PaymentMethod[]> = {};
    
    paymentMethods.forEach(method => {
      if (!method.isActive) return;
      
      if (!groups[method.type]) {
        groups[method.type] = [];
      }
      groups[method.type].push(method);
    });
    
    return groups;
  }, [paymentMethods]);

  // Get recommended methods (sorted by popularity/fees)
  const getRecommendedMethods = useCallback((countryCode?: string, amount?: number): PaymentMethod[] => {
    let methods = paymentMethods.filter(method => method.isActive);
    
    if (countryCode) {
      methods = methods.filter(method => method.countryCode === countryCode);
    }
    
    if (amount) {
      methods = methods.filter(method => {
        if (amount < method.minAmount) return false;
        if (method.maxAmount && amount > method.maxAmount) return false;
        return true;
      });
    }
    
    // Sort by processing time (faster first) and fees (lower first)
    return methods.sort((a, b) => {
      const aScore = a.processingTimeMinutes + (a.feePercentage * 10);
      const bScore = b.processingTimeMinutes + (b.feePercentage * 10);
      return aScore - bScore;
    });
  }, [paymentMethods]);

  // Check if country is supported
  const isCountrySupported = useCallback((countryCode: string): boolean => {
    return paymentMethods.some(method => 
      method.countryCode === countryCode && method.isActive
    );
  }, [paymentMethods]);

  // Get available currencies for a country
  const getCurrenciesForCountry = useCallback((countryCode: string): string[] => {
    const methods = getMethodsByCountry(countryCode);
    const currencies = new Set<string>();
    
    methods.forEach(method => {
      // Extract currency from method metadata or name
      if (method.metadata?.currency) {
        currencies.add(method.metadata.currency);
      }
    });
    
    return Array.from(currencies);
  }, [getMethodsByCountry]);

  return {
    paymentMethods: paymentMethods.filter(method => method.isActive),
    loading,
    error,
    refetch,
    
    // Filter functions
    getMethodsByCountry,
    getMethodByProvider,
    getMethodsByType,
    getMethodsByAmount,
    getYellowCardMethods,
    getMobileMoneyMethods,
    getRecommendedMethods,
    
    // Utility functions
    isAmountSupported,
    calculateFees,
    getProcessingTime,
    isCountrySupported,
    getCurrenciesForCountry,
    
    // Grouped data
    groupedMethods
  };
};

/**
 * Hook for managing a specific payment method
 */
export const usePaymentMethod = (methodId: string) => {
  const { paymentMethods, loading, error, refetch } = usePaymentMethods();
  
  const method = useMemo(() => 
    paymentMethods.find(m => m.id === methodId) || null
  , [paymentMethods, methodId]);
  
  const isSupported = useCallback((amount: number): boolean => {
    if (!method) return false;
    if (amount < method.minAmount) return false;
    if (method.maxAmount && amount > method.maxAmount) return false;
    return true;
  }, [method]);
  
  const calculateFee = useCallback((amount: number): number => {
    if (!method) return 0;
    
    const percentageFee = (amount * method.feePercentage) / 100;
    const totalFee = percentageFee + method.feeFixed;
    
    return totalFee;
  }, [method]);
  
  const getTotalAmount = useCallback((amount: number): number => {
    return amount + calculateFee(amount);
  }, [calculateFee]);
  
  return {
    method,
    loading,
    error,
    refetch,
    isSupported,
    calculateFee,
    getTotalAmount,
    processingTime: method?.processingTimeMinutes || 15,
    isActive: method?.isActive || false
  };
};

/**
 * Hook for managing payment method selection state
 */
export const usePaymentMethodSelection = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  
  const { getMethodsByCountry, getMethodsByAmount, isAmountSupported } = usePaymentMethods();
  
  // Get available methods based on current selection
  const availableMethods = useMemo(() => {
    if (selectedCountry && amount > 0) {
      return getMethodsByAmount(amount, selectedCountry);
    } else if (selectedCountry) {
      return getMethodsByCountry(selectedCountry);
    }
    return [];
  }, [selectedCountry, amount, getMethodsByCountry, getMethodsByAmount]);
  
  // Check if selected method is still valid
  useEffect(() => {
    if (selectedMethod && amount > 0) {
      if (!isAmountSupported(selectedMethod.id, amount)) {
        setSelectedMethod(null);
      }
    }
  }, [selectedMethod, amount, isAmountSupported]);
  
  // Clear method when country changes
  useEffect(() => {
    if (selectedMethod && selectedCountry && selectedMethod.countryCode !== selectedCountry) {
      setSelectedMethod(null);
    }
  }, [selectedMethod, selectedCountry]);
  
  return {
    selectedMethod,
    setSelectedMethod,
    selectedCountry,
    setSelectedCountry,
    amount,
    setAmount,
    availableMethods,
    isValidSelection: selectedMethod && 
      (!amount || isAmountSupported(selectedMethod.id, amount))
  };
};

export default usePaymentMethods; 