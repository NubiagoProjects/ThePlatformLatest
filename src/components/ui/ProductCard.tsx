'use client'

import React from 'react'
import Link from 'next/link'
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react'
import { ProductImage } from './OptimizedImage'
import { cn } from '@/utils/cn'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    originalPrice?: number
    rating: number
    reviewCount: number
    image: string
    brand: string
    inStock: boolean
    tags?: string[]
  }
  className?: string
  variant?: 'default' | 'compact' | 'featured'
  onAddToCart?: (productId: string) => void
  onAddToWishlist?: (productId: string) => void
  onQuickView?: (productId: string) => void
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  className,
  variant = 'default',
  onAddToCart,
  onAddToWishlist,
  onQuickView,
}) => {
  const {
    id,
    name,
    price,
    originalPrice,
    rating,
    reviewCount,
    image,
    brand,
    inStock,
    tags = []
  } = product

  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(id)
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToWishlist?.(id)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(id)
  }

  const cardVariants = {
    default: 'group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden',
    compact: 'group relative bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden',
    featured: 'group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100'
  }

  const imageVariants = {
    default: 'aspect-square',
    compact: 'aspect-square',
    featured: 'aspect-[4/3]'
  }

  const contentVariants = {
    default: 'p-4',
    compact: 'p-3',
    featured: 'p-6'
  }

  return (
    <article 
      className={cn(cardVariants[variant], className)}
      role="article"
      aria-labelledby={`product-title-${id}`}
      aria-describedby={`product-description-${id}`}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <Link 
          href={`/product/${id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg"
          aria-label={`View details for ${name}`}
        >
          <ProductImage
            src={image}
            alt={`${name} by ${brand}`}
            variant={variant === 'featured' ? 'detail' : 'card'}
            className={cn(
              'w-full transition-transform duration-300 group-hover:scale-105',
              imageVariants[variant]
            )}
            priority={variant === 'featured'}
          />
        </Link>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleQuickView}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Quick view ${name}`}
            title="Quick view"
          >
            <Eye size={16} className="text-gray-700" />
          </button>
          
          <button
            onClick={handleAddToWishlist}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Add ${name} to wishlist`}
            title="Add to wishlist"
          >
            <Heart size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              -{discountPercentage}%
            </span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className={contentVariants[variant]}>
        {/* Brand */}
        <p className="text-sm text-gray-500 mb-1" aria-label={`Brand: ${brand}`}>
          {brand}
        </p>

        {/* Product Name */}
        <Link 
          href={`/product/${id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
        >
          <h3 
            id={`product-title-${id}`}
            className={cn(
              'font-medium text-gray-900 mb-2 line-clamp-2 hover:text-red-600 transition-colors',
              variant === 'compact' ? 'text-sm' : 'text-base',
              variant === 'featured' && 'text-lg'
            )}
          >
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2" aria-label={`Rating: ${rating} out of 5 stars`}>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={cn(
                  'fill-current',
                  i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
                )}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            ${price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && variant !== 'compact' && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
            inStock
              ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            variant === 'compact' && 'py-1.5 px-3 text-sm'
          )}
          aria-label={`Add ${name} to cart`}
          aria-describedby={!inStock ? 'out-of-stock-message' : undefined}
        >
          <ShoppingCart size={16} />
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>

        {/* Out of Stock Message for Screen Readers */}
        {!inStock && (
          <div id="out-of-stock-message" className="sr-only">
            This product is currently out of stock
          </div>
        )}
      </div>

      {/* Product Description for Screen Readers */}
      <div id={`product-description-${id}`} className="sr-only">
        {name} by {brand}. Price: ${price.toFixed(2)}
        {originalPrice && ` Original price: $${originalPrice.toFixed(2)}`}
        {discountPercentage > 0 && ` Save ${discountPercentage}%`}
        . Rating: {rating} out of 5 stars from {reviewCount} reviews.
        {!inStock && ' Currently out of stock.'}
      </div>
    </article>
  )
})

ProductCard.displayName = 'ProductCard' 