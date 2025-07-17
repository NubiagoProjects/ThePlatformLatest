'use client'

import React, { Suspense, lazy } from 'react'
import { cn } from '@/utils/cn'

// Loading components
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
  </div>
))

const LoadingSkeleton = React.memo(({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-gray-200 rounded-lg', className)} />
))

// Lazy-loaded components with dynamic imports
const ProductCarousel = lazy(() => 
  import('@/components/ProductCarousel').then(module => ({
    default: module.ProductCarousel
  }))
)

// Placeholder components for demonstration
const AdvancedFilters = lazy(() => 
  Promise.resolve({
    default: React.memo(() => (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
        <p className="text-gray-600">Filter options will be loaded here</p>
      </div>
    ))
  })
)

const ProductComparison = lazy(() => 
  Promise.resolve({
    default: React.memo(() => (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Product Comparison</h3>
        <p className="text-gray-600">Comparison table will be loaded here</p>
      </div>
    ))
  })
)

const UserDashboard = lazy(() => 
  Promise.resolve({
    default: React.memo(() => (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">User Dashboard</h3>
        <p className="text-gray-600">Dashboard content will be loaded here</p>
      </div>
    ))
  })
)

const CheckoutForm = lazy(() => 
  Promise.resolve({
    default: React.memo(() => (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Checkout Form</h3>
        <p className="text-gray-600">Checkout form will be loaded here</p>
      </div>
    ))
  })
)

const ProductReviews = lazy(() => 
  Promise.resolve({
    default: React.memo(() => (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Product Reviews</h3>
        <p className="text-gray-600">Reviews will be loaded here</p>
      </div>
    ))
  })
)

const NewsletterSignup = lazy(() => 
  import('@/components/Newsletter').then(module => ({
    default: module.Newsletter
  }))
)

// Wrapper components with error boundaries
interface LazyComponentWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
}

const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = React.memo(({
  children,
  fallback = <LoadingSpinner />,
  errorFallback = <div className="text-red-600">Failed to load component</div>
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
})

LazyComponentWrapper.displayName = 'LazyComponentWrapper'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

// Optimized Product Carousel
export const LazyProductCarousel: React.FC<{ products: any[] }> = React.memo(({ products }) => (
  <LazyComponentWrapper
    fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-64" />
        ))}
      </div>
    }
  >
    <ProductCarousel />
  </LazyComponentWrapper>
))

LazyProductCarousel.displayName = 'LazyProductCarousel'

// Optimized Advanced Filters
export const LazyAdvancedFilters: React.FC<{ onFilterChange: (filters: any) => void }> = React.memo(({ onFilterChange }) => (
  <LazyComponentWrapper
    fallback={<LoadingSkeleton className="h-96" />}
  >
    <AdvancedFilters />
  </LazyComponentWrapper>
))

LazyAdvancedFilters.displayName = 'LazyAdvancedFilters'

// Optimized Product Comparison
export const LazyProductComparison: React.FC<{ products: any[] }> = React.memo(({ products }) => (
  <LazyComponentWrapper
    fallback={<LoadingSkeleton className="h-96" />}
  >
    <ProductComparison />
  </LazyComponentWrapper>
))

LazyProductComparison.displayName = 'LazyProductComparison'

// Optimized User Dashboard
export const LazyUserDashboard: React.FC<{ userId: string }> = React.memo(({ userId }) => (
  <LazyComponentWrapper
    fallback={<LoadingSkeleton className="h-screen" />}
  >
    <UserDashboard />
  </LazyComponentWrapper>
))

LazyUserDashboard.displayName = 'LazyUserDashboard'

// Optimized Checkout Form
export const LazyCheckoutForm: React.FC<{ cartItems: any[] }> = React.memo(({ cartItems }) => (
  <LazyComponentWrapper
    fallback={<LoadingSkeleton className="h-96" />}
  >
    <CheckoutForm />
  </LazyComponentWrapper>
))

LazyCheckoutForm.displayName = 'LazyCheckoutForm'

// Optimized Product Reviews
export const LazyProductReviews: React.FC<{ productId: string }> = React.memo(({ productId }) => (
  <LazyComponentWrapper
    fallback={<LoadingSkeleton className="h-64" />}
  >
    <ProductReviews />
  </LazyComponentWrapper>
))

LazyProductReviews.displayName = 'LazyProductReviews'

// Optimized Newsletter Signup
export const LazyNewsletterSignup: React.FC = React.memo(() => (
  <LazyComponentWrapper
    fallback={<LoadingSkeleton className="h-32" />}
  >
    <NewsletterSignup />
  </LazyComponentWrapper>
))

LazyNewsletterSignup.displayName = 'LazyNewsletterSignup'

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor component load times
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`Component load time: ${entry.name} - ${entry.duration}ms`)
            
            // Send to analytics if available
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'component_load', {
                component_name: entry.name,
                load_time: entry.duration,
              })
            }
          }
        }
      })

      observer.observe({ entryTypes: ['measure'] })

      return () => observer.disconnect()
    }
  }, [])
}

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setIsIntersecting(true)
          setHasIntersected(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
        ...options,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [hasIntersected, options])

  return { ref, isIntersecting, hasIntersected }
}

// Preload component hook
export const usePreloadComponent = (componentPath: string) => {
  React.useEffect(() => {
    const preloadComponent = () => {
      // Preload the component when user hovers over trigger
      import(componentPath)
    }

    return preloadComponent
  }, [componentPath])
}

// Bundle size monitoring
export const useBundleSizeMonitor = () => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const bundleSize = navigation.transferSize || 0
        console.log(`Bundle size: ${(bundleSize / 1024).toFixed(2)}KB`)
        
        // Send to analytics if available
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'bundle_size', {
            size_kb: bundleSize / 1024,
            page: window.location.pathname,
          })
        }
      }
    }
  }, [])
} 