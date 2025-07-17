import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
}

export const BaseSelect = React.forwardRef<HTMLSelectElement, BaseSelectProps>(
  ({ label, error, helperText, options, className, id, ...props }, ref) => {
    const generatedId = React.useId()
    const selectId = id || generatedId
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'block w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition disabled:opacity-60',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error ? (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-red-600">{error}</p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
BaseSelect.displayName = 'BaseSelect' 