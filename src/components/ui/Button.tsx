'use client'

import React from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = React.memo(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-base gap-2 min-h-[48px]',
    xl: 'px-8 py-4 text-lg gap-3 min-h-[56px]'
  }

  const widthClasses = fullWidth ? 'w-full' : ''

  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClasses,
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Content */}
      <span className={loading ? 'sr-only' : ''}>
        {children}
      </span>

      {/* Right Icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

// Icon Button Component
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  'aria-label': string
  icon: React.ReactNode
}

export const IconButton: React.FC<IconButtonProps> = React.memo(({
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}) => {
  const iconSizeClasses = {
    sm: 'p-1.5 min-w-[32px] min-h-[32px]',
    md: 'p-2 min-w-[40px] min-h-[40px]',
    lg: 'p-3 min-w-[48px] min-h-[48px]',
    xl: 'p-4 min-w-[56px] min-h-[56px]'
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(iconSizeClasses[size], className)}
      {...props}
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
    </Button>
  )
})

IconButton.displayName = 'IconButton'

// Link Button Component
interface LinkButtonProps {
  href: string
  external?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children: React.ReactNode
}

export const LinkButton: React.FC<LinkButtonProps> = React.memo(({
  href,
  external = false,
  variant = 'primary',
  size = 'md',
  className,
  children,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95'
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-base gap-2 min-h-[48px]',
    xl: 'px-8 py-4 text-lg gap-3 min-h-[56px]'
  }

  const linkProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': `${children} (opens in new tab)`
  } : {}

  return (
    <a
      href={href}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...linkProps}
    >
      {children}
      {external && (
        <svg
          className="ml-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  )
})

LinkButton.displayName = 'LinkButton'

// Toggle Button Component
interface ToggleButtonProps {
  pressed: boolean
  onToggle: (pressed: boolean) => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  'aria-label': string
  children: React.ReactNode
}

export const ToggleButton: React.FC<ToggleButtonProps> = React.memo(({
  pressed,
  onToggle,
  variant = 'outline',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const handleClick = () => {
    onToggle(!pressed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(!pressed)
    }
  }

  return (
    <Button
      variant={pressed ? 'primary' : variant}
      size={size}
      className={cn(
        pressed && 'ring-2 ring-red-500 ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={pressed}
      {...props}
    >
      {children}
    </Button>
  )
})

ToggleButton.displayName = 'ToggleButton'

// Loading Button Component
interface LoadingButtonProps {
  loadingText?: string
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children: React.ReactNode
}

export const LoadingButton: React.FC<LoadingButtonProps> = React.memo(({
  loadingText = 'Loading...',
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <Button
      loading={loading}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  )
})

LoadingButton.displayName = 'LoadingButton' 