'use client'

import React from 'react'
import { Wallet, Plus, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

interface WalletBalanceProps {
  balance: number
  currency: string
  isLoading?: boolean
  onRefresh?: () => void
  onAddFunds?: () => void
  className?: string
  showAddFunds?: boolean
  hideBalance?: boolean
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  currency,
  isLoading = false,
  onRefresh,
  onAddFunds,
  className,
  showAddFunds = true,
  hideBalance = false
}) => {
  const [isBalanceVisible, setIsBalanceVisible] = React.useState(!hideBalance)

  const formatBalance = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className={cn(
      'bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {hideBalance && (
            <button
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="p-1 hover:bg-blue-400/20 rounded transition-colors"
            >
              {isBalanceVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 hover:bg-blue-400/20 rounded transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-8 w-24 bg-blue-400/30 rounded animate-pulse" />
            ) : isBalanceVisible ? (
              formatBalance(balance)
            ) : (
              '••••••'
            )}
          </div>
          <div className="text-blue-100 text-sm">Available balance</div>
        </div>

        {showAddFunds && onAddFunds && (
          <button
            onClick={onAddFunds}
            className="flex items-center space-x-2 w-full bg-white/10 hover:bg-white/20 rounded-lg py-2 px-3 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Funds</span>
          </button>
        )}
      </div>

      {balance < 10 && (
        <div className="mt-3 p-2 bg-yellow-500/20 rounded text-xs text-yellow-100">
          ⚠️ Low balance - consider adding funds for seamless payments
        </div>
      )}
    </div>
  )
} 