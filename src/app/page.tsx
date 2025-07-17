import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { FeaturedCategories } from '@/components/FeaturedCategories'
import { ProductCarousel } from '@/components/ProductCarousel'
import { HowItWorks } from '@/components/HowItWorks'
import { Testimonials } from '@/components/Testimonials'
import { Newsletter } from '@/components/Newsletter'
import { FirebaseTest } from '@/components/FirebaseTest'

export const metadata: Metadata = {
  title: 'Nubiago - Shop Everyday Essentials',
  description: 'Discover amazing deals on electronics, fashion, home & garden, beauty, and more. Shop from trusted sellers with fast delivery and secure payments.',
  keywords: 'online shopping, ecommerce, electronics, fashion, home decor, beauty products, books, sports equipment, toys, groceries',
  openGraph: {
    title: 'Nubiago - Shop Everyday Essentials',
    description: 'Discover amazing deals on electronics, fashion, home & garden, beauty, and more. Shop from trusted sellers with fast delivery and secure payments.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Nubiago',
    images: [
      {
        url: '/og-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'Nubiago - Your trusted online marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nubiago - Shop Everyday Essentials',
    description: 'Discover amazing deals on electronics, fashion, home & garden, beauty, and more.',
    images: ['/og-homepage.jpg'],
  },
  alternates: {
    canonical: 'https://nubiago.com',
  },
}

// Structured data for homepage
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Nubiago',
  description: 'Shop everyday essentials from trusted sellers — simple, quick, and reliable.',
  url: 'https://nubiago.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://nubiago.com/products?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
  sameAs: [
    'https://facebook.com/nubiago',
    'https://twitter.com/nubiago',
    'https://instagram.com/nubiago',
  ],
}

export default function HomePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <FeaturedCategories />
        <ProductCarousel />
        <HowItWorks />
        <Testimonials />
        <Newsletter />
        
        {/* Firebase Connection Test - Remove after testing */}
        <FirebaseTest />
      </main>
      <Footer />
    </>
  )
} 