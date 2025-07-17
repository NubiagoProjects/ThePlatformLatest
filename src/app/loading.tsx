import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function Loading() {
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Loading...
              </h2>
              <p className="text-lg text-gray-600">
                Please wait while we load the page for you.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 