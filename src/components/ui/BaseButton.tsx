import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses = {
  primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
  outline: 'border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 focus:ring-gray-400',
  ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-400',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
  icon: 'p-2 rounded-full',
}

export const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      disabled={disabled || loading}
      tabIndex={0}
      {...props}
    >
      {loading && (
        <svg className="animate-spin mr-2 h-4 w-4 text-current" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
)
BaseButton.displayName = 'BaseButton' 