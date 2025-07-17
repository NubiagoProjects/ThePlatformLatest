'use client'

import React from 'react'
import { CreditCard, Smartphone, Wallet, DollarSign } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'mobile_money' | 'wallet' | 'crypto'
  icon: React.ReactNode
  isAvailable: boolean
  fee?: number
  description?: string
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selectedMethod?: string
  onMethodSelect: (methodId: string) => void
  className?: string
}

const defaultMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: <CreditCard className="w-6 h-6" />,
    isAvailable: true,
    fee: 0,
    description: 'Visa, Mastercard, American Express'
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    type: 'mobile_money',
    icon: <Smartphone className="w-6 h-6" />,
    isAvailable: true,
    fee: 0,
    description: 'MTN, Orange, Airtel, and others'
  },
  {
    id: 'wallet',
    name: 'Wallet Balance',
    type: 'wallet',
    icon: <Wallet className="w-6 h-6" />,
    isAvailable: true,
    fee: 0,
    description: 'Use your wallet balance'
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    type: 'crypto',
    icon: <DollarSign className="w-6 h-6" />,
    isAvailable: false,
    fee: 0,
    description: 'Bitcoin, USDT, and others'
  }
]

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods = defaultMethods,
  selectedMethod,
  onMethodSelect,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
      
      <div className="grid gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => method.isAvailable && onMethodSelect(method.id)}
            disabled={!method.isAvailable}
            className={cn(
              'flex items-center justify-between p-4 border rounded-lg transition-all',
              'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
              selectedMethod === method.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white',
              !method.isAvailable && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-full',
                selectedMethod === method.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              )}>
                {method.icon}
              </div>
              
              <div className="text-left">
                <div className="font-medium text-gray-900">{method.name}</div>
                {method.description && (
                  <div className="text-sm text-gray-500">{method.description}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {method.fee && method.fee > 0 && (
                <span className="text-sm text-gray-500">+${method.fee}</span>
              )}
              
              <div className={cn(
                'w-4 h-4 border-2 rounded-full transition-all',
                selectedMethod === method.id 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              )}>
                {selectedMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
} 