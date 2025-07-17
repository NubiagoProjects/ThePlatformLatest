/**
 * React Hook for User Location Detection and Mobile Money Provider Management
 */

import { useState, useEffect, useCallback } from 'react';
import { geoIPService, LocationData } from '@/lib/geoip';
import { getProvidersForCountry, MOBILE_MONEY_PROVIDERS } from '@/modules/payments/constants/countries';
import type { MobileMoneyProvider } from '@/modules/payments/types';

interface UseUserLocationState {
  location: LocationData | null;
  countryCode: string | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

interface UseUserLocationReturn extends UseUserLocationState {
  refetch: () => Promise<void>;
  clearLocation: () => void;
  providers: Array<typeof MOBILE_MONEY_PROVIDERS[keyof typeof MOBILE_MONEY_PROVIDERS]>;
  hasProviders: boolean;
}

/**
 * Hook for detecting user location and getting relevant mobile money providers
 */
export const useUserLocation = (): UseUserLocationReturn => {
  const [state, setState] = useState<UseUserLocationState>({
    location: null,
    countryCode: null,
    isLoading: true,
    error: null,
    isSupported: false
  });

  const [providers, setProviders] = useState<Array<typeof MOBILE_MONEY_PROVIDERS[keyof typeof MOBILE_MONEY_PROVIDERS]>>([]);

  const detectLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First check if we have cached location
      const cachedLocation = geoIPService.getCachedLocation();
      if (cachedLocation) {
        const isSupported = await geoIPService.isInSupportedRegion();
        const countryProviders = getProvidersForCountry(cachedLocation.countryCode);
        
        setState({
          location: cachedLocation,
          countryCode: cachedLocation.countryCode,
          isLoading: false,
          error: null,
          isSupported
        });
        setProviders(countryProviders);
        return;
      }

      // Detect new location
      const location = await geoIPService.detectLocation();
      
      if (!location) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to detect location. Please select your country manually.'
        }));
        return;
      }

      const isSupported = await geoIPService.isInSupportedRegion();
      const countryProviders = getProvidersForCountry(location.countryCode);

      setState({
        location,
        countryCode: location.countryCode,
        isLoading: false,
        error: null,
        isSupported
      });
      setProviders(countryProviders);

      // Store in localStorage for faster subsequent loads
      try {
        localStorage.setItem('userLocation', JSON.stringify({
          location,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache location in localStorage:', e);
      }

    } catch (error) {
      console.error('Location detection failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Location detection failed'
      }));
    }
  }, []);

  const refetch = useCallback(async () => {
    geoIPService.clearCache();
    await detectLocation();
  }, [detectLocation]);

  const clearLocation = useCallback(() => {
    geoIPService.clearCache();
    setState({
      location: null,
      countryCode: null,
      isLoading: false,
      error: null,
      isSupported: false
    });
    setProviders([]);
    
    try {
      localStorage.removeItem('userLocation');
    } catch (e) {
      console.warn('Failed to clear location from localStorage:', e);
    }
  }, []);

  // Initialize location detection on mount
  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      // Try to load from localStorage first (faster)
      try {
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          const { location, timestamp } = JSON.parse(cached);
          const isStale = Date.now() - timestamp > 30 * 60 * 1000; // 30 minutes
          
          if (!isStale && mounted) {
            const isSupported = await geoIPService.isInSupportedRegion();
            const countryProviders = getProvidersForCountry(location.countryCode);
            
            setState({
              location,
              countryCode: location.countryCode,
              isLoading: false,
              error: null,
              isSupported
            });
            setProviders(countryProviders);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load cached location:', e);
      }

      // Fallback to fresh detection
      if (mounted) {
        await detectLocation();
      }
    };

    initializeLocation();

    return () => {
      mounted = false;
    };
  }, [detectLocation]);

  return {
    ...state,
    refetch,
    clearLocation,
    providers,
    hasProviders: providers.length > 0
  };
};

/**
 * Hook for getting providers for a specific country
 */
export const useProvidersForCountry = (countryCode: string | null) => {
  const [providers, setProviders] = useState<Array<typeof MOBILE_MONEY_PROVIDERS[keyof typeof MOBILE_MONEY_PROVIDERS]>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!countryCode) {
      setProviders([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const countryProviders = getProvidersForCountry(countryCode);
      setProviders(countryProviders);
    } catch (error) {
      console.error('Failed to get providers for country:', error);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  }, [countryCode]);

  return {
    providers,
    isLoading,
    hasProviders: providers.length > 0
  };
};

/**
 * Hook for provider selection and management
 */
export const useProviderSelection = () => {
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { providers: autoProviders, countryCode } = useUserLocation();
  const { providers: manualProviders } = useProvidersForCountry(selectedCountry);

  const providers = selectedCountry ? manualProviders : autoProviders;
  const currentCountry = selectedCountry || countryCode;

  const selectProvider = useCallback((provider: MobileMoneyProvider) => {
    setSelectedProvider(provider);
  }, []);

  const selectCountry = useCallback((country: string) => {
    setSelectedCountry(country);
    setSelectedProvider(null); // Reset provider when country changes
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProvider(null);
    setSelectedCountry(null);
  }, []);

  const getSelectedProviderDetails = useCallback(() => {
    if (!selectedProvider) return null;
    return MOBILE_MONEY_PROVIDERS[selectedProvider];
  }, [selectedProvider]);

  return {
    selectedProvider,
    selectedCountry: currentCountry,
    providers,
    hasProviders: providers.length > 0,
    selectProvider,
    selectCountry,
    clearSelection,
    getSelectedProviderDetails,
    isAutoDetected: !selectedCountry && !!countryCode
  };
}; 