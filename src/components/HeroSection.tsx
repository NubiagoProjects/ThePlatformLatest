'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIcon, ChevronRightIcon, Globe, Award, Smartphone, ShirtIcon, Sofa, Home, Brush, Utensils, BookOpen } from 'lucide-react';

const categoryList = [{
  name: 'Electronics',
  icon: Smartphone
}, {
  name: 'Clothing',
  icon: ShirtIcon
}, {
  name: 'Furniture',
  icon: Sofa
}, {
  name: 'Home & Kitchen',
  icon: Home
}, {
  name: 'Beauty',
  icon: Brush
}, {
  name: 'Groceries',
  icon: Utensils
}, {
  name: 'Books',
  icon: BookOpen
}];

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleQuickSearch = (query: string) => {
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-12 xl:py-16" style={{ backgroundColor: '#0F52BA' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12">
          {/* Categories Column - Responsive Layout */}
          <div className="w-full lg:w-[30%] xl:w-[25%] bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 sm:p-4 lg:p-6 border border-white/20">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 border-b border-gray-200 pb-2 sm:pb-3">
              Browse Categories
            </h3>
            <ul className="space-y-1 sm:space-y-2">
              {categoryList.map((category, index) => (
                <li key={index}>
                  <Link 
                    href={`/products?category=${encodeURIComponent(category.name)}`}
                    className="flex items-center py-2 px-2 sm:px-3 text-sm sm:text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors group"
                  >
                    <category.icon size={16} className="sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="flex-grow truncate">{category.name}</span>
                    <ChevronRightIcon size={14} className="sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Hero Content - Responsive Layout */}
          <div className="w-full lg:w-[70%] xl:w-[75%]">
            <div className="max-w-4xl mx-auto">
              {/* Badges Section - Responsive */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg border border-white/30">
                  <Globe size={14} className="sm:w-4 sm:h-4 text-blue-600 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">34+ Countries In Africa</span>
                </div>
                <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg border border-white/30">
                  <Award size={14} className="sm:w-4 sm:h-4 text-amber-600 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">Best Quality Products</span>
                </div>
              </div>

              {/* Main Hero Content - Responsive Typography */}
              <div className="text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 leading-tight">
                  Find what you need,{' '}
                  <span className="text-yellow-300">faster!</span>
                </h1>
                
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Shop everyday essentials from trusted sellers across Africa — simple, quick,
                  and reliable.
                </p>

                {/* Search Bar - Responsive */}
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8 lg:mb-10">
                  <input 
                    type="text" 
                    placeholder="e.g., smartphone, lipstick, washing machine…" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 sm:py-4 pl-4 sm:pl-5 pr-12 sm:pr-14 rounded-full border-0 shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-blue-600 text-sm sm:text-base lg:text-lg bg-white/95 backdrop-blur-sm" 
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg touch-target"
                  >
                    <SearchIcon size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </form>

                {/* Quick Category Chips - Responsive */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6 sm:mb-8 lg:mb-10">
                  {categoryList.slice(0, 4).map(category => (
                    <button 
                      key={category.name} 
                      onClick={() => handleQuickSearch(category.name)}
                      className="bg-white/90 backdrop-blur-sm py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm border border-white/30 hover:border-yellow-300 hover:text-blue-600 transition-colors shadow-lg font-medium cursor-pointer touch-target"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* CTA Buttons - Responsive */}
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4">
                  <Link href="/products">
                    <button className="w-full sm:w-auto bg-yellow-400 text-blue-900 py-2.5 sm:py-3 px-6 sm:px-8 rounded-full hover:bg-yellow-300 transition-colors font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 text-sm sm:text-base touch-target">
                      Browse Products
                    </button>
                  </Link>
                  <Link href="/sellers">
                    <button className="w-full sm:w-auto bg-white/90 backdrop-blur-sm text-blue-900 py-2.5 sm:py-3 px-6 sm:px-8 rounded-full border border-white/30 hover:bg-white transition-colors font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 text-sm sm:text-base touch-target">
                      Become a Seller
                    </button>
                  </Link>
                </div>

                {/* Trust Indicators - Responsive */}
                <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-blue-100">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-300 rounded-full mr-1.5 sm:mr-2 shadow-sm"></div>
                    <span className="font-medium">Fast Delivery</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-300 rounded-full mr-1.5 sm:mr-2 shadow-sm"></div>
                    <span className="font-medium">Secure Payment</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-300 rounded-full mr-1.5 sm:mr-2 shadow-sm"></div>
                    <span className="font-medium">24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Spacer for Bottom Navigation */}
        <div className="h-16 lg:hidden"></div>
      </div>
    </section>
  );
};