/**
 * Dynamic Provider Selector Component
 * Automatically displays mobile money providers based on user's detected location
 */

'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { MapPin, Globe, Smartphone, Clock, AlertCircle, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { useUserLocation, useProviderSelection } from '@/hooks/useUserLocation';
import { AFRICAN_COUNTRIES } from '@/modules/payments/constants/countries';
import type { MobileMoneyProvider } from '@/modules/payments/types';

interface DynamicProviderSelectorProps {
  onProviderSelect?: (provider: MobileMoneyProvider, countryCode: string) => void;
  onLocationChange?: (countryCode: string) => void;
  className?: string;
  showCountrySelector?: boolean;
  showInstructions?: boolean;
  compact?: boolean;
}

export const DynamicProviderSelector: React.FC<DynamicProviderSelectorProps> = ({
  onProviderSelect,
  onLocationChange,
  className = '',
  showCountrySelector = true,
  showInstructions = true,
  compact = false
}) => {
  const {
    location,
    countryCode,
    isLoading,
    error,
    isSupported,
    refetch
  } = useUserLocation();

  const {
    selectedProvider,
    selectedCountry,
    providers,
    hasProviders,
    selectProvider,
    selectCountry,
    getSelectedProviderDetails,
    isAutoDetected
  } = useProviderSelection();

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  const handleProviderSelect = useCallback((provider: MobileMoneyProvider) => {
    selectProvider(provider);
    const currentCountry = selectedCountry || countryCode;
    if (onProviderSelect && currentCountry) {
      onProviderSelect(provider, currentCountry);
    }
  }, [selectProvider, selectedCountry, countryCode, onProviderSelect]);

  const handleCountrySelect = useCallback((country: string) => {
    selectCountry(country);
    setShowCountryDropdown(false);
    if (onLocationChange) {
      onLocationChange(country);
    }
  }, [selectCountry, onLocationChange]);

  const selectedProviderDetails = getSelectedProviderDetails();
  const currentCountry = selectedCountry || countryCode;
  const currentCountryName = currentCountry 
    ? AFRICAN_COUNTRIES.find(c => c.code === currentCountry)?.name || currentCountry
    : 'Unknown';

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Detecting your location...</span>
        </div>
      </div>
    );
  }

  if (error && !currentCountry) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
          <div className="flex-grow">
            <h3 className="text-red-800 font-medium">Location Detection Failed</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <div className="flex space-x-3 mt-3">
              <button
                onClick={refetch}
                className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowCountryDropdown(true)}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Select Manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isAutoDetected ? (
                <MapPin className="w-5 h-5 text-green-600" />
              ) : (
                <Globe className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {isAutoDetected ? 'Detected Location' : 'Selected Country'}
                </h3>
                <p className="text-sm text-gray-600">{currentCountryName}</p>
              </div>
            </div>
          </div>
          
          {showCountrySelector && (
            <div className="relative">
              <button
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <span>Change Country</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showCountryDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {AFRICAN_COUNTRIES.filter(c => c.isSupported).map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country.code)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{country.name}</span>
                        {country.code === currentCountry && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isSupported && currentCountry && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Limited Support</p>
                <p>Mobile money services may be limited in this region.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Providers Section */}
      <div className="p-4">
        {!hasProviders ? (
          <div className="text-center py-8">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-1">No Providers Available</h3>
            <p className="text-gray-600 text-sm">
              No mobile money providers found for {currentCountryName}.
            </p>
          </div>
        ) : (
          <>
            <h4 className="font-medium text-gray-900 mb-3">
              Available Mobile Money Providers ({providers.length})
            </h4>
            
            <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {providers.map((provider) => (
                <div
                  key={provider.code}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProvider === provider.code
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleProviderSelect(provider.code)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={provider.logo}
                        alt={provider.name}
                        fill
                        className="object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/providers/default-provider.png';
                        }}
                      />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">
                        {provider.shortName}
                      </h5>
                      <p className="text-sm text-gray-600 truncate">
                        {provider.ussdCode}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            ~{provider.processingTime}min
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Fee: {provider.feeStructure.percentage}%
                        </div>
                      </div>
                    </div>
                    
                    {selectedProvider === provider.code && (
                      <div className="flex-shrink-0">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Selected Provider Instructions */}
      {selectedProviderDetails && showInstructions && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h5 className="font-medium text-gray-900 mb-2">Payment Instructions</h5>
          <div className="text-sm text-gray-700 space-y-1">
            {selectedProviderDetails.instructions.steps.slice(0, 3).map((step, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 text-xs rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
            {selectedProviderDetails.instructions.steps.length > 3 && (
              <button
                onClick={() => setShowInstructionsModal(true)}
                className="text-blue-600 text-sm hover:underline ml-7"
              >
                View all {selectedProviderDetails.instructions.steps.length} steps
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructionsModal && selectedProviderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedProviderDetails.name} Instructions
                </h3>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Steps:</h4>
                {selectedProviderDetails.instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 text-sm rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
                
                <h4 className="font-medium text-gray-900 mt-4">Tips:</h4>
                {selectedProviderDetails.instructions.tips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-blue-600">•</span>
                    <span className="text-sm text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 