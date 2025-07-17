'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CheckCircle, Package, MapPin, Download, Home, User } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const orderDetails = {
    orderId: 'ORD-' + Date.now().toString().slice(-6),
    orderDate: new Date().toLocaleDateString(),
    total: 129.97,
    items: [
      {
        name: 'Wireless Bluetooth Headphones',
        quantity: 1,
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Cotton T-Shirt',
        quantity: 2,
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    trackingNumber: '1Z999AA' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  const downloadInvoice = () => {
    // Simulate invoice download
    const invoiceContent = `
      INVOICE
      Order ID: ${orderDetails.orderId}
      Date: ${orderDetails.orderDate}
      Total: $${orderDetails.total}
      
      Items:
      ${orderDetails.items.map(item => `${item.name} x${item.quantity} - $${item.price}`).join('\n')}
    `
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${orderDetails.orderId}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-600 text-lg">Thank you for your purchase. Your order has been successfully placed.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Package size={20} className="mr-2" />
                  Order Details
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{orderDetails.orderDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg">${orderDetails.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking Number:</span>
                    <span className="font-medium">{orderDetails.trackingNumber}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={downloadInvoice}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download Invoice
                  </button>
                  <Link
                    href={`/dashboard/user/orders`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <User size={16} className="mr-2" />
                    View My Orders
                  </Link>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin size={20} className="mr-2" />
                  Shipping Information
                </h2>
                
                <div className="space-y-2">
                  <div className="font-medium">{orderDetails.shippingAddress.name}</div>
                  <div>{orderDetails.shippingAddress.address}</div>
                  <div>{orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}</div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Estimated Delivery</h3>
                  <p className="text-gray-600">3-5 business days</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Order Processing</h3>
                  <p className="text-sm text-gray-600">We'll start processing your order immediately</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Shipping Updates</h3>
                  <p className="text-sm text-gray-600">You'll receive email updates on your order status</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Delivery</h3>
                  <p className="text-sm text-gray-600">Your order will arrive in 3-5 business days</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                href="/"
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
              >
                <Home size={16} className="mr-2" />
                Continue Shopping
              </Link>
              <Link
                href={`/dashboard/user/orders`}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
              >
                <User size={16} className="mr-2" />
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 