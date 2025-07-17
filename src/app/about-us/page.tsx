import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'About Us - Nubiago Story, Mission & Values',
  description: 'Learn about Nubiago\'s journey from startup to trusted e-commerce platform. Discover our mission to connect buyers with quality sellers and our commitment to customer satisfaction.',
  keywords: 'about Nubiago, company history, mission, values, team, ecommerce platform, online marketplace',
  openGraph: {
    title: 'About Us - Nubiago Story, Mission & Values',
    description: 'Learn about Nubiago\'s journey from startup to trusted e-commerce platform.',
    type: 'website',
    url: 'https://nubiago.com/about-us',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Nubiago Story, Mission & Values',
    description: 'Learn about Nubiago\'s journey and mission.',
  },
  alternates: {
    canonical: 'https://nubiago.com/about-us',
  },
}

// Structured data for about page
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nubiago',
  description: 'Trusted e-commerce platform connecting buyers with quality sellers',
  url: 'https://nubiago.com',
  logo: 'https://nubiago.com/logo.png',
  foundingDate: '2025',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-555-0123',
    contactType: 'customer service',
    email: 'support@nubiago.com',
  },
  sameAs: [
    'https://facebook.com/nubiago',
    'https://twitter.com/nubiago',
    'https://instagram.com/nubiago',
    'https://linkedin.com/company/nubiago',
  ],
}

export default function AboutUsPage() {
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
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              About Nubiago
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to make online shopping simple, reliable, and enjoyable for everyone.
            </p>
          </section>

          {/* Mission Section */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  At Nubiago, we believe that everyone deserves access to quality products at fair prices. 
                  Our platform connects trusted sellers with discerning buyers, creating a marketplace 
                  built on transparency, reliability, and mutual success.
                </p>
                <p className="text-lg text-gray-700">
                  We're committed to providing an exceptional shopping experience with secure payments, 
                  fast delivery, and outstanding customer support.
                </p>
              </div>
              <div className="bg-blue-50 p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Our Values
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">Trust & Transparency</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">Customer First</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">Quality Assurance</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">Innovation</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Journey Timeline */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Our Journey
            </h2>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                  2025
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Platform Launch
                  </h3>
                  <p className="text-gray-700">
                    Nubiago officially launches with a vision to revolutionize online shopping 
                    and connect quality sellers with customers worldwide.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                  2026
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Rapid Growth
                  </h3>
                  <p className="text-gray-700">
                    Reached 1 million users and expanded product categories to include 
                    electronics, fashion, home & garden, and more.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                  2027
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Mobile App Launch
                  </h3>
                  <p className="text-gray-700">
                    Launched our mobile app to provide seamless shopping experience 
                    on-the-go with advanced features and personalized recommendations.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                  2028
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI Integration
                  </h3>
                  <p className="text-gray-700">
                    Implemented AI-powered recommendations, smart search, and 
                    automated customer support to enhance user experience.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Nubiago by the Numbers
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">5M+</div>
                  <div className="text-blue-100">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">50K+</div>
                  <div className="text-blue-100">Trusted Sellers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">1M+</div>
                  <div className="text-blue-100">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">99.9%</div>
                  <div className="text-blue-100">Uptime</div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Meet Our Team
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sarah Johnson
                </h3>
                <p className="text-gray-600 mb-2">CEO & Founder</p>
                <p className="text-sm text-gray-500">
                  Former tech executive with 15+ years in e-commerce
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Michael Chen
                </h3>
                <p className="text-gray-600 mb-2">CTO</p>
                <p className="text-sm text-gray-500">
                  Expert in scalable architecture and AI systems
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Emily Rodriguez
                </h3>
                <p className="text-gray-600 mb-2">Head of Operations</p>
                <p className="text-sm text-gray-500">
                  Specialized in customer experience and logistics
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Join the Nubiago Community
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Whether you're a buyer looking for quality products or a seller wanting to reach 
              more customers, we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/products"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Start Shopping
              </a>
              <a
                href="/contact-us"
                className="border border-blue-500 text-blue-500 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
} 