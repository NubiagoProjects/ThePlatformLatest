'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  role?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt,
  width = 400,
  height = 400,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  role = 'img',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imageRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imageRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    )

    observer.observe(imageRef.current)

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Fallback image for errors
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={`${alt} - Image failed to load`}
      >
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" ref={imageRef}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            className
          )}
          style={{ width, height }}
          aria-hidden="true"
        />
      )}

      {/* Optimized Image */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          priority={priority}
          sizes={sizes}
          quality={quality}
          placeholder={placeholder}
          loading={loading}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
          role={role}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedby}
          {...(blurDataURL && { blurDataURL })}
          {...props}
        />
      )}

      {/* Accessibility improvements */}
      {!isLoaded && (
        <div className="sr-only">
          Loading image: {alt}
        </div>
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// Product Image Component with specific optimizations
interface ProductImageProps extends Omit<OptimizedImageProps, 'sizes' | 'quality'> {
  variant?: 'thumbnail' | 'card' | 'detail' | 'gallery'
}

export const ProductImage: React.FC<ProductImageProps> = React.memo(({
  variant = 'card',
  ...props
}) => {
  const imageConfig = {
    thumbnail: {
      width: 150,
      height: 150,
      sizes: '150px',
      quality: 80,
    },
    card: {
      width: 300,
      height: 300,
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
      quality: 85,
    },
    detail: {
      width: 600,
      height: 600,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px',
      quality: 90,
    },
    gallery: {
      width: 800,
      height: 800,
      sizes: '(max-width: 768px) 100vw, 800px',
      quality: 90,
    },
  }

  const config = imageConfig[variant]

  return (
    <OptimizedImage
      {...props}
      {...config}
      className={cn(
        'object-cover rounded-lg',
        variant === 'thumbnail' && 'rounded-md',
        variant === 'card' && 'hover:scale-105 transition-transform duration-300',
        props.className
      )}
    />
  )
})

ProductImage.displayName = 'ProductImage'

// Hero Image Component for above-the-fold content
interface HeroImageProps extends Omit<OptimizedImageProps, 'priority' | 'loading'> {
  aspectRatio?: '16/9' | '21/9' | '4/3' | '1/1'
}

export const HeroImage: React.FC<HeroImageProps> = React.memo(({
  aspectRatio = '16/9',
  ...props
}) => {
  const aspectRatioClasses = {
    '16/9': 'aspect-video',
    '21/9': 'aspect-[21/9]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
  }

  return (
    <OptimizedImage
      {...props}
      priority={true}
      loading="eager"
      className={cn(
        'object-cover w-full',
        aspectRatioClasses[aspectRatio],
        props.className
      )}
      sizes="100vw"
    />
  )
})

HeroImage.displayName = 'HeroImage'

// Avatar Image Component for user profiles
interface AvatarImageProps extends Omit<OptimizedImageProps, 'sizes' | 'quality'> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const AvatarImage: React.FC<AvatarImageProps> = React.memo(({
  size = 'md',
  ...props
}) => {
  const sizeConfig = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  }

  const config = sizeConfig[size]

  return (
    <OptimizedImage
      {...props}
      {...config}
      className={cn(
        'rounded-full object-cover',
        props.className
      )}
      sizes={`${config.width}px`}
      quality={80}
    />
  )
})

AvatarImage.displayName = 'AvatarImage' 