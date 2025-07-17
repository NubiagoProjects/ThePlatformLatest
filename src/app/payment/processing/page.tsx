'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CheckCircle, Clock, CreditCard, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentProcessingPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing')
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Simulate payment processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setStatus('success')
          // Redirect to order confirmation after 2 seconds
          setTimeout(() => {
            router.push('/payment/success')
          }, 2000)
          return 100
        }
        return prev + 10
      })
    }, 500)

    return () => clearInterval(interval)
  }, [router])

  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {status === 'processing' && (
                <>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
                    <p className="text-gray-600">Please wait while we process your payment securely.</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
                  </div>

                  {/* Security Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <Shield size={20} className="text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Secure Payment Processing</span>
                    </div>
                  </div>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                    <p className="text-gray-600">Your order has been placed successfully.</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Redirecting to order confirmation...</span>
                    </div>
                  </div>
                </>
              )}

              {status === 'failed' && (
                <>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="text-red-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                    <p className="text-gray-600">There was an issue processing your payment. Please try again.</p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push('/checkout')}
                      className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => router.push('/cart')}
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Back to Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 