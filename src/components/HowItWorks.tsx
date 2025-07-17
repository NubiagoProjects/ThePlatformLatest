import React from 'react';
import { Search, Truck, Shield, CreditCard } from 'lucide-react';
const steps = [{
  title: 'Browse Easily',
  description: 'Find products with our intuitive search and filters',
  icon: Search,
  color: 'bg-blue-100 text-blue-600'
}, {
  title: 'Fast Delivery',
  description: 'Get your orders quickly with our efficient shipping',
  icon: Truck,
  color: 'bg-green-100 text-green-600'
}, {
  title: 'Trusted Sellers',
  description: 'Shop with confidence from verified merchants',
  icon: Shield,
  color: 'bg-purple-100 text-purple-600'
}, {
  title: 'Secure Checkout',
  description: 'Pay safely with our protected payment system',
  icon: CreditCard,
  color: 'bg-amber-100 text-amber-600'
}];
export const HowItWorks = () => {
  return <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Nubiago
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => <div key={index} className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mb-4`}>
                <step.icon size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>)}
        </div>
      </div>
    </section>;
};