'use client'

import React from 'react'
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export type PaymentStatusType = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'

interface PaymentStatusProps {
  status: PaymentStatusType
  message?: string
  transactionId?: string
  className?: string
  showDetails?: boolean
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Payment Pending',
    defaultMessage: 'Your payment is being prepared'
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Processing Payment',
    defaultMessage: 'Your payment is being processed'
  },
  succeeded: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Payment Successful',
    defaultMessage: 'Your payment has been completed successfully'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Payment Failed',
    defaultMessage: 'Your payment could not be processed'
  },
  canceled: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Payment Canceled',
    defaultMessage: 'Your payment has been canceled'
  }
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  message,
  transactionId,
  className,
  showDetails = true
}) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn(
      'p-4 border rounded-lg',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
          <Icon 
            className={cn(
              'w-5 h-5',
              status === 'processing' && 'animate-spin'
            )} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn('text-sm font-medium', config.color)}>
            {config.title}
          </h3>
          
          <p className="mt-1 text-sm text-gray-600">
            {message || config.defaultMessage}
          </p>
          
          {showDetails && transactionId && (
            <div className="mt-2 text-xs text-gray-500">
              Transaction ID: {transactionId}
            </div>
          )}
          
          {status === 'processing' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This may take a few moments...
              </p>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="mt-2">
              <button className="text-sm text-red-600 hover:text-red-800 underline">
                Try again
              </button>
            </div>
          )}
          
          {status === 'succeeded' && showDetails && (
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div>✓ Payment confirmed</div>
              <div>✓ Receipt sent to email</div>
              <div>✓ Order processing</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 