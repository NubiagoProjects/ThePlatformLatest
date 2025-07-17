import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductDetail } from '@/components/ProductDetail'

// Mock product data - replace with real API call
const getProduct = async (id: string) => {
  const products = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals who need crystal-clear audio quality.',
      price: 89.99,
      originalPrice: 129.99,
      images: ['/images/headphones-1.jpg', '/images/headphones-2.jpg'],
      category: 'Electronics',
      brand: 'AudioTech',
      rating: 4.5,
      reviewCount: 128,
      inStock: true,
      sku: 'ATH-BT001',
      features: [
        'Active Noise Cancellation',
        '30-hour battery life',
        'Bluetooth 5.0',
        'Built-in microphone',
        'Foldable design'
      ],
      specifications: {
        'Battery Life': '30 hours',
        'Connectivity': 'Bluetooth 5.0',
        'Weight': '250g',
        'Warranty': '2 years'
      }
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      description: 'Advanced fitness tracking with heart rate monitoring and GPS. Track your workouts, monitor your health, and stay connected with this feature-rich smartwatch.',
      price: 199.99,
      originalPrice: 249.99,
      images: ['/images/watch-1.jpg', '/images/watch-2.jpg'],
      category: 'Electronics',
      brand: 'FitTech',
      rating: 4.3,
      reviewCount: 89,
      inStock: true,
      sku: 'FT-WATCH001',
      features: [
        'Heart rate monitoring',
        'GPS tracking',
        'Water resistant',
        '7-day battery life',
        'Sleep tracking'
      ],
      specifications: {
        'Display': '1.4" AMOLED',
        'Battery': '7 days',
        'Water Resistance': '5ATM',
        'GPS': 'Built-in'
      }
    }
  ]
  
  return products.find(p => p.id === id) || null
}

// Generate static params for static generation
export async function generateStaticParams() {
  // In a real app, fetch product IDs from your API
  const productIds = ['1', '2']
  
  return productIds.map((id) => ({
    id: id,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id)
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  const productUrl = `https://nubiago.com/product/${params.id}`
  const productImage = product.images[0] || '/images/product-placeholder.jpg'

  return {
    title: `${product.name} - ${product.brand} | Nubiago`,
    description: product.description,
    keywords: [
      product.name,
      product.brand,
      product.category,
      'buy online',
      'best price',
      'free shipping',
      'secure payment'
    ],
    openGraph: {
      title: `${product.name} - ${product.brand}`,
      description: product.description,
      type: 'website',
      url: productUrl,
      images: [
        {
          url: productImage,
          width: 600,
          height: 600,
          alt: product.name,
        },
      ],
      siteName: 'Nubiago',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - ${product.brand}`,
      description: product.description,
      images: [productImage],
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'USD',
      'product:availability': product.inStock ? 'in stock' : 'out of stock',
      'product:condition': 'new',
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  // Generate structured data for the product
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "category": product.category,
    "sku": product.sku,
    "mpn": product.sku,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "USD",
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      "availability": product.inStock 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Nubiago"
      },
      "url": `https://nubiago.com/product/${params.id}`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Verified Buyer"
        },
        "reviewBody": "Excellent product quality and fast delivery!"
      }
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <ProductDetail product={product} />
        </div>
      </main>
      <Footer />
    </>
  )
} 