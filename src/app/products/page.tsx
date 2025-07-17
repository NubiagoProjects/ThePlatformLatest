import type { Metadata } from 'next'
import { AllProducts } from '@/components/AllProducts'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'All Products - Shop Electronics, Fashion, Home & More',
  description: 'Browse our complete collection of products including electronics, fashion, home & garden, beauty, books, sports equipment, and more. Find the best deals and trusted sellers.',
  keywords: 'products, electronics, fashion, home decor, beauty, books, sports, toys, groceries, online shopping',
  openGraph: {
    title: 'All Products - Shop Electronics, Fashion, Home & More',
    description: 'Browse our complete collection of products including electronics, fashion, home & garden, beauty, books, sports equipment, and more.',
    type: 'website',
    url: 'https://nubiago.com/products',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Products - Shop Electronics, Fashion, Home & More',
    description: 'Browse our complete collection of products with the best deals.',
  },
  alternates: {
    canonical: 'https://nubiago.com/products',
  },
}

// Structured data for products page
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'All Products',
  description: 'Complete collection of products available on Nubiago',
  url: 'https://nubiago.com/products',
  numberOfItems: 1000,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Product',
        name: 'Smartphone',
        description: 'Latest smartphones with advanced features',
        category: 'Electronics',
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Product',
        name: 'Fashion Clothing',
        description: 'Trendy fashion items for all seasons',
        category: 'Fashion',
      },
    },
  ],
}

export default function ProductsPage() {
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Products
            </h1>
            <p className="text-gray-600">
              Discover amazing deals on thousands of products from trusted sellers
            </p>
          </div>
          <AllProducts />
        </div>
      </main>
      <Footer />
    </>
  )
} 