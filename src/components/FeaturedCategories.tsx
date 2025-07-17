'use client'

import React from 'react';
import Link from 'next/link';
import { Smartphone, ShirtIcon, Sofa, Home, Brush, Utensils, BookOpen } from 'lucide-react';

const categories = [{
  name: 'Electronics',
  icon: Smartphone,
  color: 'bg-blue-100 text-blue-600'
}, {
  name: 'Clothing',
  icon: ShirtIcon,
  color: 'bg-purple-100 text-purple-600'
}, {
  name: 'Furniture',
  icon: Sofa,
  color: 'bg-amber-100 text-amber-600'
}, {
  name: 'Home & Kitchen',
  icon: Home,
  color: 'bg-green-100 text-green-600'
}, {
  name: 'Beauty',
  icon: Brush,
  color: 'bg-pink-100 text-pink-600'
}, {
  name: 'Groceries',
  icon: Utensils,
  color: 'bg-red-100 text-red-600'
}, {
  name: 'Books',
  icon: BookOpen,
  color: 'bg-indigo-100 text-indigo-600'
}];

export const FeaturedCategories = () => {
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Responsive */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Featured Categories
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing products across all categories, from electronics to fashion and everything in between.
          </p>
        </div>

        {/* Categories Grid - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {categories.map(category => (
            <Link 
              key={category.name} 
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center p-3 sm:p-4 md:p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-white hover:bg-gray-50 transform hover:-translate-y-1 touch-target"
            >
              {/* Icon Container - Responsive */}
              <div className={`p-2 sm:p-3 md:p-4 rounded-full ${category.color} mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
              </div>
              
              {/* Category Name - Responsive */}
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-gray-800 text-center leading-tight group-hover:text-gray-900 transition-colors">
                {category.name}
              </h3>
              
              {/* Hover Indicator */}
              <div className="w-0 group-hover:w-8 h-0.5 bg-red-600 mt-2 transition-all duration-300"></div>
            </Link>
          ))}
        </div>

        {/* View All Categories Button - Responsive */}
        <div className="text-center mt-8 sm:mt-12 lg:mt-16">
          <Link href="/categories">
            <button className="bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-red-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base touch-target">
              View All Categories
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};