import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

export const BaseCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  ({ asChild, className, children, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'div'
    return (
      <Comp
        {...(!asChild ? { ref, className: cn('bg-white dark:bg-gray-800 rounded-lg shadow p-6', className), ...props } : {})}
      >
        {children}
      </Comp>
    )
  }
)
BaseCard.displayName = 'BaseCard' 