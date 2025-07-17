import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductGrid } from '@/components/features/product/ProductGrid'

export const metadata: Metadata = {
  title: 'Search Results - Find Products | Nubiago',
  description: 'Search and discover products on Nubiago. Find the best deals on electronics, fashion, home & garden, beauty, and more.',
  robots: {
    index: true,
    follow: true,
  },
}

// Mock search function - replace with real API call
const searchProducts = async (query: string, category?: string, priceRange?: string) => {
  const allProducts = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      price: 89.99,
      originalPrice: 129.99,
      image: '/images/headphones-1.jpg',
      category: 'Electronics',
      rating: 4.5,
      reviewCount: 128,
      inStock: true,
      isNew: true,
      isOnSale: true,
      tags: ['wireless', 'bluetooth', 'noise-cancelling'],
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      price: 199.99,
      originalPrice: 249.99,
      image: '/images/watch-1.jpg',
      category: 'Electronics',
      rating: 4.3,
      reviewCount: 89,
      inStock: true,
      isNew: false,
      isOnSale: true,
      tags: ['fitness', 'smartwatch', 'health'],
    },
    {
      id: '3',
      name: 'Designer T-Shirt',
      price: 29.99,
      originalPrice: 39.99,
      image: '/images/tshirt-1.jpg',
      category: 'Fashion',
      rating: 4.2,
      reviewCount: 56,
      inStock: true,
      isNew: false,
      isOnSale: true,
      tags: ['fashion', 'clothing', 'casual'],
    },
    {
      id: '4',
      name: 'Garden Tool Set',
      price: 45.99,
      originalPrice: 59.99,
      image: '/images/garden-tools.jpg',
      category: 'Home & Garden',
      rating: 4.1,
      reviewCount: 34,
      inStock: true,
      isNew: false,
      isOnSale: true,
      tags: ['garden', 'tools', 'outdoor'],
    },
  ]

  // Simple search implementation
  let filtered = allProducts.filter(product => {
    const matchesQuery = !query || 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    
    const matchesCategory = !category || product.category === category
    
    return matchesQuery && matchesCategory
  })

  return filtered
}

interface SearchPageProps {
  searchParams: {
    q?: string
    category?: string
    price?: string
    sort?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query, category, price, sort } = searchParams
  const products = await searchProducts(query || '', category, price)

  // Generate metadata based on search query
  const searchTitle = query 
    ? `Search Results for "${query}" - Nubiago`
    : 'Search Products - Nubiago'
  
  const searchDescription = query
    ? `Find the best deals on ${query} and related products. Browse our selection of quality items from trusted sellers.`
    : 'Search and discover amazing products on Nubiago. Find the best deals on electronics, fashion, home & garden, and more.'

  // Structured data for search results
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: searchTitle,
    description: searchDescription,
    url: `https://nubiago.com/search?q=${encodeURIComponent(query || '')}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: `${product.name} - ${product.category}`,
        image: product.image,
        category: product.category,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Nubiago',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        },
      },
    })),
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {query ? `Search Results for "${query}"` : 'Search Products'}
            </h1>
            <p className="text-gray-600">
              {products.length} product{products.length !== 1 ? 's' : ''} found
              {query && ` for "${query}"`}
            </p>
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:w-48">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={category}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Books">Books</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
              
              <div className="md:w-48">
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {products.length > 0 ? (
            <ProductGrid 
              products={products}
              showFilters={false}
              showSort={true}
              showViewToggle={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                {query 
                  ? `We couldn't find any products matching "${query}"`
                  : 'Try adjusting your search criteria'
                }
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Suggestions:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Check your spelling</li>
                  <li>• Try more general keywords</li>
                  <li>• Browse our categories</li>
                </ul>
              </div>
            </div>
          )}

          {/* Related Searches */}
          {query && products.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Related Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {['wireless', 'bluetooth', 'smart', 'portable'].map((term) => (
                  <a
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
} 