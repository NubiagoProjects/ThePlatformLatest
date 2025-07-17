import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BaseToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  onClose?: () => void
  duration?: number
}

const typeClasses = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-700',
}

export const BaseToast: React.FC<BaseToastProps> = ({
  open,
  message,
  type = 'info',
  onClose,
  duration = 3000,
  className,
  ...props
}) => {
  React.useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [open, onClose, duration])

  if (!open) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2',
        typeClasses[type],
        className
      )}
      {...props}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  )
} 