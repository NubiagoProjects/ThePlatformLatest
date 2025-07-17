'use client'

import { StarIcon, ShoppingCartIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Sample product data
const products = [
  {
    id: 1,
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    originalPrice: 99.99,
    rating: 4.5,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    name: 'Smart Watch Series 5',
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.8,
    reviews: 256,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    name: 'Premium Coffee Maker',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.3,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 4,
    name: 'Wireless Earbuds Pro',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.6,
    reviews: 203,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  }
]

export function ProductCarousel() {
  const [startIndex, setStartIndex] = useState(0)

  const nextSlide = () => {
    setStartIndex((prevIndex) => (prevIndex + 1) % Math.max(1, products.length - 2))
  }

  const prevSlide = () => {
    setStartIndex((prevIndex) => (prevIndex - 1 + Math.max(1, products.length - 2)) % Math.max(1, products.length - 2))
  }

  const visibleProducts = products.slice(startIndex, startIndex + 3)

  return (
    <section className="py-16 bg-white" aria-labelledby="featured-products-heading">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 id="featured-products-heading" className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <p className="text-gray-600">Discover our most popular items</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Previous products"
            >
              <ChevronLeftIcon size={20} aria-hidden="true" />
            </button>
            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Next products"
            >
              <ChevronRightIcon size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleProducts.map((product) => (
            <article key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <Link href={`/product/${product.id}`}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </Link>
                <button 
                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label={`Add ${product.name} to wishlist`}
                >
                  <HeartIcon size={16} aria-hidden="true" />
                </button>
                {product.originalPrice > product.price && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-red-600 transition-colors">{product.name}</h3>
                </Link>
                
                <div className="flex items-center mb-3">
                  <div className="flex items-center" role="img" aria-label={`${product.rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        size={16}
                        className={`${
                          i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">({product.reviews})</span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-900">${product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-lg text-gray-500 line-through ml-2">${product.originalPrice}</span>
                    )}
                  </div>
                </div>
                
                <button 
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <ShoppingCartIcon size={16} className="mr-2" aria-hidden="true" />
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductCarousel