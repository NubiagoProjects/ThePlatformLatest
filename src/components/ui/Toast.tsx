'use client'

import React, { useEffect } from 'react'
import { XIcon, CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react'
import { useAppToasts, useAppActions } from '@/stores/useAppStore'

const toastIcons = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconStyles = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

export const ToastContainer: React.FC = () => {
  const toasts = useAppToasts()
  const { removeToast } = useAppActions()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

interface ToastProps {
  toast: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
  }
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const Icon = toastIcons[toast.type]

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`flex items-start p-4 border rounded-lg shadow-lg transition-all duration-300 ease-in-out ${toastStyles[toast.type]}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${iconStyles[toast.type]}`} />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{toast.title}</h4>
        {toast.message && (
          <p className="mt-1 text-sm opacity-90">{toast.message}</p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook for easy toast usage
export const useToast = () => {
  const { addToast } = useAppActions()

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message: message || '', ...(duration !== undefined && { duration }) }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message: message || '', ...(duration !== undefined && { duration }) }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message: message || '', ...(duration !== undefined && { duration }) }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message: message || '', ...(duration !== undefined && { duration }) }),
  }
} 