import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'block w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition disabled:opacity-60',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">{error}</p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
BaseInput.displayName = 'BaseInput' 