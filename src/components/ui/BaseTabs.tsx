import * as React from 'react'
import { cn } from '@/utils/cn'

export interface Tab {
  label: string
  value: string
  disabled?: boolean
}

export interface BaseTabsProps {
  tabs: Tab[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export const BaseTabs: React.FC<BaseTabsProps> = ({ tabs, value, onChange, className }) => {
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex(tab => tab.value === value)
    if (e.key === 'ArrowRight') {
      let next = (idx + 1) % tabs.length
      while (tabs[next].disabled) next = (next + 1) % tabs.length
      onChange(tabs[next].value)
      tabRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      let prev = (idx - 1 + tabs.length) % tabs.length
      while (tabs[prev].disabled) prev = (prev - 1 + tabs.length) % tabs.length
      onChange(tabs[prev].value)
      tabRefs.current[prev]?.focus()
    }
  }

  return (
    <div className={cn('flex space-x-2', className)} role="tablist" aria-orientation="horizontal" onKeyDown={handleKeyDown}>
      {tabs.map((tab, i) => (
        <button
          key={tab.value}
          ref={el => (tabRefs.current[i] = el)}
          role="tab"
          aria-selected={value === tab.value}
          aria-controls={`tabpanel-${tab.value}`}
          tabIndex={tab.disabled ? -1 : 0}
          disabled={tab.disabled}
          className={cn(
            'px-4 py-2 rounded-t-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
            value === tab.value
              ? 'bg-white dark:bg-gray-800 text-red-600 shadow'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200',
            tab.disabled && 'opacity-50 pointer-events-none'
          )}
          onClick={() => !tab.disabled && onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
} 