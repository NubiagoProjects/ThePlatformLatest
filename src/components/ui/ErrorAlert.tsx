'use client'

import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ErrorAlertProps {
  title?: string
  message: string
  onDismiss?: () => void
  className?: string
  variant?: 'error' | 'warning' | 'info'
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  onDismiss,
  className,
  variant = 'error'
}) => {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconStyles = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }

  return (
    <div className={cn(
      'flex items-start p-4 border rounded-lg',
      variantStyles[variant],
      className
    )}>
      <AlertCircle className={cn('w-5 h-5 mt-0.5 mr-3 flex-shrink-0', iconStyles[variant])} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-medium mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
} 