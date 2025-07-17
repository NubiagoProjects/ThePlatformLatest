import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductGrid } from '@/components/features/product/ProductGrid'

// Mock category data - replace with real API call
const getCategory = async (slug: string) => {
  const categories = {
    'electronics': {
      name: 'Electronics',
      description: 'Latest electronics and gadgets including smartphones, laptops, headphones, and smart devices.',
      image: '/images/categories/electronics.jpg',
      productCount: 150,
      featured: true,
    },
    'fashion': {
      name: 'Fashion & Clothing',
      description: 'Trendy fashion items, clothing, shoes, and accessories for all seasons and occasions.',
      image: '/images/categories/fashion.jpg',
      productCount: 300,
      featured: true,
    },
    'home-garden': {
      name: 'Home & Garden',
      description: 'Everything for your home and garden including furniture, decor, tools, and outdoor items.',
      image: '/images/categories/home-garden.jpg',
      productCount: 200,
      featured: true,
    },
    'beauty': {
      name: 'Beauty & Personal Care',
      description: 'Beauty products, skincare, makeup, and personal care items from top brands.',
      image: '/images/categories/beauty.jpg',
      productCount: 120,
      featured: true,
    },
    'books': {
      name: 'Books & Media',
      description: 'Books, magazines, movies, music, and educational materials for all ages.',
      image: '/images/categories/books.jpg',
      productCount: 80,
      featured: false,
    },
    'sports': {
      name: 'Sports & Outdoors',
      description: 'Sports equipment, outdoor gear, fitness accessories, and athletic wear.',
      image: '/images/categories/sports.jpg',
      productCount: 90,
      featured: false,
    },
  }
  
  return categories[slug as keyof typeof categories] || null
}

// Mock products for category - replace with real API call
const getCategoryProducts = async (categorySlug: string) => {
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
    },
  ]
  
  return allProducts.filter(p => p.category.toLowerCase() === categorySlug)
}

// Generate static params for static generation
export async function generateStaticParams() {
  const categorySlugs = ['electronics', 'fashion', 'home-garden', 'beauty', 'books', 'sports']
  
  return categorySlugs.map((slug) => ({
    slug: slug,
  }))
}

// Generate metadata for each category
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategory(params.slug)
  
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    }
  }

  return {
    title: `${category.name} - Shop ${category.name} Online | Nubiago`,
    description: category.description,
    keywords: `${category.name}, online shopping, ${category.name.toLowerCase()}, ecommerce, best deals`,
    openGraph: {
      title: `${category.name} - Shop Online`,
      description: category.description,
      type: 'website',
      images: [
        {
          url: category.image,
          width: 800,
          height: 600,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - Shop Online`,
      description: category.description,
      images: [category.image],
    },
    alternates: {
      canonical: `https://nubiago.com/category/${params.slug}`,
    },
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }

  const products = await getCategoryProducts(params.slug)

  // Structured data for category
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://nubiago.com/category/${params.slug}`,
    image: category.image,
    numberOfItems: category.productCount,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          image: product.image,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'USD',
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
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
          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={category.image}
                alt={category.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {category.name}
                </h1>
                <p className="text-gray-600">
                  {category.productCount} products available
                </p>
              </div>
            </div>
            <p className="text-gray-700 max-w-3xl">
              {category.description}
            </p>
          </div>

          {/* Products Grid */}
          <ProductGrid 
            products={products}
            showFilters={true}
            showSort={true}
            showViewToggle={true}
          />
        </div>
      </main>
      <Footer />
    </>
  )
} 