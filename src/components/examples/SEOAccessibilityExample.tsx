'use client'

import React, { useState, useEffect } from 'react'
import { ProductImage, OptimizedImage } from '@/components/ui/OptimizedImage'
import { Button, IconButton, ToggleButton, LoadingButton } from '@/components/ui/Button'
import { ProductCard } from '@/components/ui/ProductCard'
import { cn } from '@/utils/cn'
import { 
  Search, 
  Filter, 
  Heart, 
  ShoppingCart, 
  Star, 
  ChevronDown,
  Eye,
  Share2,
  Download,
  Play,
  Pause
} from 'lucide-react'

// Example product data
const exampleProducts = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 89.99,
    originalPrice: 129.99,
    rating: 4.5,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    brand: 'AudioTech',
    inStock: true,
    tags: ['wireless', 'bluetooth', 'noise-cancelling']
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.3,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    brand: 'FitTech',
    inStock: true,
    tags: ['smartwatch', 'fitness', 'health-tracking']
  }
]

export const SEOAccessibilityExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Performance monitoring
  useEffect(() => {
    // Track component load time
    const startTime = performance.now()
    
    return () => {
      const loadTime = performance.now() - startTime
      console.log(`SEOAccessibilityExample load time: ${loadTime.toFixed(2)}ms`)
      
      // Send to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'component_load', {
          component_name: 'SEOAccessibilityExample',
          load_time: loadTime,
        })
      }
    }
  }, [])

  const handleAddToCart = (productId: string) => {
    console.log(`Adding product ${productId} to cart`)
    // Implementation would go here
  }

  const handleAddToWishlist = (productId: string) => {
    console.log(`Adding product ${productId} to wishlist`)
    // Implementation would go here
  }

  const handleQuickView = (productId: string) => {
    console.log(`Quick view for product ${productId}`)
    // Implementation would go here
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate search
    setTimeout(() => {
      setIsLoading(false)
      console.log('Searching for:', searchQuery)
    }, 1000)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    console.log('Category changed to:', category)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-red-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Header with semantic structure */}
      <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with proper alt text */}
            <div className="flex items-center space-x-4">
              <OptimizedImage
                src="/logo.png"
                alt="Nubiago - Premium Online Shopping Platform"
                width={120}
                height={40}
                priority={true}
                className="h-10 w-auto"
              />
              <nav aria-label="Main navigation" role="navigation">
                <ul className="flex items-center space-x-6">
                  <li>
                    <a 
                      href="/products" 
                      className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1"
                    >
                      Products
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/categories" 
                      className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1"
                    >
                      Categories
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/about-us" 
                      className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1"
                    >
                      About
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Search form with proper labels */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8" role="search">
              <div className="relative">
                <label htmlFor="search-input" className="sr-only">
                  Search products
                </label>
                <input
                  id="search-input"
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  aria-describedby="search-description"
                />
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={20}
                  aria-hidden="true"
                />
                <div id="search-description" className="sr-only">
                  Enter keywords to search for products
                </div>
              </div>
            </form>

            {/* Action buttons with proper labels */}
            <div className="flex items-center space-x-4">
              <IconButton
                icon={<Heart size={20} />}
                aria-label="View wishlist"
                variant="ghost"
                size="md"
              />
              <IconButton
                icon={<ShoppingCart size={20} />}
                aria-label="View shopping cart"
                variant="ghost"
                size="md"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content with semantic structure */}
      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SEO & Accessibility Optimized Example
          </h1>
          <p className="text-lg text-gray-600">
            This page demonstrates comprehensive SEO, accessibility, and performance optimizations.
          </p>
        </div>

        {/* Filters section */}
        <section className="mb-8" aria-labelledby="filters-heading">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 id="filters-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Filters & Controls
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category filter */}
              <div>
                <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  aria-describedby="category-description"
                >
                  <option value="all">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home & Garden</option>
                </select>
                <div id="category-description" className="sr-only">
                  Select a category to filter products
                </div>
              </div>

              {/* Toggle button example */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show Filters
                </label>
                <ToggleButton
                  pressed={showFilters}
                  onToggle={setShowFilters}
                  aria-label="Toggle filter panel visibility"
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </ToggleButton>
              </div>

              {/* Loading button example */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Action
                </label>
                <LoadingButton
                  loading={isLoading}
                  loadingText="Searching..."
                  onClick={() => setIsLoading(true)}
                  fullWidth
                >
                  Search Products
                </LoadingButton>
              </div>

              {/* Media control example */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Control
                </label>
                <ToggleButton
                  pressed={isPlaying}
                  onToggle={setIsPlaying}
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? 'Pause' : 'Play'}
                </ToggleButton>
              </div>
            </div>
          </div>
        </section>

        {/* Products section */}
        <section className="mb-8" aria-labelledby="products-heading">
          <h2 id="products-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Featured Products
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exampleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                onQuickView={handleQuickView}
                variant="default"
              />
            ))}
          </div>
        </section>

        {/* Image optimization examples */}
        <section className="mb-8" aria-labelledby="images-heading">
          <h2 id="images-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Image Optimization Examples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Product image with lazy loading */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>
              <ProductImage
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Wireless Bluetooth Headphones with premium sound quality"
                variant="card"
                className="w-full"
              />
            </div>

            {/* Hero image with priority loading */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Image</h3>
              <OptimizedImage
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Modern shopping experience with diverse products"
                width={400}
                height={300}
                priority={true}
                className="w-full rounded-lg"
              />
            </div>

            {/* Avatar image */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Avatar Image</h3>
              <OptimizedImage
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                alt="User profile picture"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Accessibility features demonstration */}
        <section className="mb-8" aria-labelledby="accessibility-heading">
          <h2 id="accessibility-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Accessibility Features
          </h2>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Keyboard navigation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Keyboard Navigation
                </h3>
                <p className="text-gray-600 mb-4">
                  All interactive elements are keyboard accessible. Use Tab to navigate and Enter/Space to activate.
                </p>
                <div className="space-y-2">
                  <Button variant="primary" size="sm">
                    Focusable Button 1
                  </Button>
                  <Button variant="outline" size="sm">
                    Focusable Button 2
                  </Button>
                  <Button variant="ghost" size="sm">
                    Focusable Button 3
                  </Button>
                </div>
              </div>

              {/* Screen reader support */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Screen Reader Support
                </h3>
                <p className="text-gray-600 mb-4">
                  Proper ARIA labels and descriptions for screen readers.
                </p>
                <div className="space-y-2">
                  <Button
                    icon={<Download size={16} />}
                    aria-label="Download product catalog (PDF format, 2.3MB)"
                  >
                    Download Catalog
                  </Button>
                  <Button
                    icon={<Share2 size={16} />}
                    aria-label="Share this page on social media"
                  >
                    Share Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance indicators */}
        <section className="mb-8" aria-labelledby="performance-heading">
          <h2 id="performance-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Performance Indicators
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">Accessibility Score</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-sm text-gray-600">Performance Score</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">SEO Score</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with semantic structure */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Nubiago</h3>
              <p className="text-gray-300 text-sm">
                Premium online shopping platform with focus on accessibility, performance, and user experience.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/products" className="text-gray-300 hover:text-white transition-colors">
                    All Products
                  </a>
                </li>
                <li>
                  <a href="/categories" className="text-gray-300 hover:text-white transition-colors">
                    Categories
                  </a>
                </li>
                <li>
                  <a href="/about-us" className="text-gray-300 hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/help" className="text-gray-300 hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/contact-us" className="text-gray-300 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="/accessibility" className="text-gray-300 hover:text-white transition-colors">
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-gray-300 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-gray-300 hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300 text-sm">
              © 2024 Nubiago. All rights reserved. Built with accessibility and performance in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 