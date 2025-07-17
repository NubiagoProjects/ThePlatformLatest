import Link from 'next/link'
import type { Metadata, Viewport } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Page Not Found - Nubiago',
  description: 'The page you are looking for could not be found',
}

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Page Not Found
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/">
                <button className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium">
                  Go back home
                </button>
              </Link>
              
              <Link href="/products">
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Browse products
                </button>
              </Link>
            </div>

            <div className="mt-8">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <Link href="/help-center" className="text-red-600 hover:text-red-700">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 