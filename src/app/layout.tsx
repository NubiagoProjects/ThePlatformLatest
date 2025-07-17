import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppProviders from '@/providers/AppProviders'
import { ToastContainer } from '@/components/ui/Toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' }
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nubiago.com'),
  title: {
    default: 'Nubiago - Premium Online Shopping Platform',
    template: '%s | Nubiago'
  },
  description: 'Discover amazing products at unbeatable prices. Shop the latest trends in electronics, fashion, home & garden, beauty, and more from trusted sellers across Africa.',
  keywords: [
    'ecommerce',
    'online shopping',
    'electronics',
    'fashion',
    'home & garden',
    'beauty products',
    'books',
    'sports equipment',
    'toys',
    'groceries',
    'Africa',
    'shopping platform',
    'trusted sellers',
    'fast delivery',
    'secure payments'
  ],
  authors: [{ name: 'Nubiago Team', url: 'https://nubiago.com' }],
  creator: 'Nubiago',
  publisher: 'Nubiago',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'fr-FR': '/fr-FR',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nubiago.com',
    title: 'Nubiago - Premium Online Shopping Platform',
    description: 'Discover amazing products at unbeatable prices. Shop the latest trends in electronics, fashion, home & garden, and more.',
    siteName: 'Nubiago',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nubiago - Premium Online Shopping Platform',
        type: 'image/jpeg',
      },
      {
        url: '/og-image-square.jpg',
        width: 600,
        height: 600,
        alt: 'Nubiago Logo',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nubiago - Premium Online Shopping Platform',
    description: 'Discover amazing products at unbeatable prices. Shop the latest trends in electronics, fashion, home & garden, and more.',
    images: ['/twitter-image.jpg'],
    creator: '@nubiago',
    site: '@nubiago',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'ecommerce',
  classification: 'shopping',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Nubiago',
    'application-name': 'Nubiago',
    'msapplication-TileColor': '#dc2626',
    'msapplication-config': '/browserconfig.xml',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/og-image.jpg" as="image" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//api.nubiago.com" />
        <link rel="dns-prefetch" href="//cdn.stripe.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.nubiago.com" />
        <link rel="preconnect" href="https://cdn.stripe.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Nubiago",
              "url": "https://nubiago.com",
              "logo": "https://nubiago.com/logo.png",
              "description": "Premium online shopping platform for electronics, fashion, home & garden, and more.",
              "sameAs": [
                "https://facebook.com/nubiago",
                "https://twitter.com/nubiago",
                "https://instagram.com/nubiago"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-123-4567",
                "contactType": "customer service",
                "availableLanguage": ["English", "French"]
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AppProviders>
          {children}
          <ToastContainer />
        </AppProviders>
        
        {/* Performance monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Core Web Vitals monitoring
              if ('PerformanceObserver' in window) {
                // LCP
                new PerformanceObserver((entryList) => {
                  for (const entry of entryList.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                      console.log('LCP:', entry.startTime);
                      // Send to analytics
                      if (typeof gtag !== 'undefined') {
                        gtag('event', 'LCP', { value: entry.startTime });
                      }
                    }
                  }
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // FID
                new PerformanceObserver((entryList) => {
                  for (const entry of entryList.getEntries()) {
                    if (entry.entryType === 'first-input') {
                      console.log('FID:', entry.processingStart - entry.startTime);
                      if (typeof gtag !== 'undefined') {
                        gtag('event', 'FID', { 
                          value: entry.processingStart - entry.startTime 
                        });
                      }
                    }
                  }
                }).observe({ entryTypes: ['first-input'] });

                // CLS
                let clsValue = 0;
                new PerformanceObserver((entryList) => {
                  for (const entry of entryList.getEntries()) {
                    if (entry.entryType === 'layout-shift') {
                      clsValue += entry.value;
                    }
                  }
                  console.log('CLS:', clsValue);
                  if (typeof gtag !== 'undefined') {
                    gtag('event', 'CLS', { value: clsValue });
                  }
                }).observe({ entryTypes: ['layout-shift'] });
              }
            `
          }}
        />
      </body>
    </html>
  )
} 