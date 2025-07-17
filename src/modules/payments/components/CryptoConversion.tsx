'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CryptoConversionProps {
  amount: number
  fromCurrency: string
  toCurrency: string
  onConversionUpdate?: (convertedAmount: number, rate: number) => void
  className?: string
}

interface ConversionRate {
  rate: number
  lastUpdated: Date
  change24h: number
}

const mockRates: Record<string, ConversionRate> = {
  'USD_BTC': {
    rate: 0.000023,
    lastUpdated: new Date(),
    change24h: 2.5
  },
  'USD_ETH': {
    rate: 0.0004,
    lastUpdated: new Date(),
    change24h: -1.8
  },
  'USD_USDT': {
    rate: 1.0,
    lastUpdated: new Date(),
    change24h: 0.1
  }
}

export const CryptoConversion: React.FC<CryptoConversionProps> = ({
  amount,
  fromCurrency,
  toCurrency,
  onConversionUpdate,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [conversionData, setConversionData] = useState<ConversionRate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rateKey = `${fromCurrency}_${toCurrency}`

  const fetchConversionRate = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real implementation, this would call a crypto API
      const rate = mockRates[rateKey] || {
        rate: 0.000025,
        lastUpdated: new Date(),
        change24h: 0
      }

      setConversionData(rate)
      
      if (onConversionUpdate) {
        onConversionUpdate(amount * rate.rate, rate.rate)
      }
    } catch (err) {
      setError('Failed to fetch conversion rate')
    } finally {
      setIsLoading(false)
    }
  }, [rateKey, amount, onConversionUpdate])

  useEffect(() => {
    fetchConversionRate()
  }, [amount, fromCurrency, toCurrency, fetchConversionRate])

  const convertedAmount = conversionData ? amount * conversionData.rate : 0

  return (
    <div className={cn('bg-gray-50 rounded-lg p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Crypto Conversion</h3>
        <button
          onClick={fetchConversionRate}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="font-medium">{amount} {fromCurrency}</span>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-gray-200" />
            <div className="px-2 text-xs text-gray-500">converts to</div>
            <div className="w-full h-px bg-gray-200" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">You'll receive</span>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {isLoading ? '...' : convertedAmount.toFixed(8)} {toCurrency}
              </div>
              {conversionData && (
                <div className="text-xs text-gray-500">
                  Rate: 1 {fromCurrency} = {conversionData.rate.toFixed(8)} {toCurrency}
                </div>
              )}
            </div>
          </div>

          {conversionData && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">24h change</span>
              <div className={cn(
                'flex items-center space-x-1',
                conversionData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {conversionData.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(conversionData.change24h).toFixed(2)}%</span>
              </div>
            </div>
          )}

          {conversionData && (
            <div className="text-xs text-gray-500">
              Last updated: {conversionData.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 