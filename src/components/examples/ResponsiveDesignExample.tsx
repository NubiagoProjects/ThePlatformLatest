'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SearchIcon, MenuIcon, Smartphone, Tablet, Monitor, MonitorSmartphone } from 'lucide-react';

/**
 * Comprehensive responsive design example component
 * Demonstrates all responsive patterns implemented in Phase 6
 */
export const ResponsiveDesignExample: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deviceInfo = [
    { name: 'iPhone SE', width: '320px', icon: Smartphone, color: 'bg-blue-500' },
    { name: 'iPhone 12', width: '390px', icon: Smartphone, color: 'bg-blue-600' },
    { name: 'Galaxy S21', width: '360px', icon: Smartphone, color: 'bg-green-500' },
    { name: 'iPad Mini', width: '768px', icon: Tablet, color: 'bg-purple-500' },
    { name: 'iPad Air', width: '820px', icon: Tablet, color: 'bg-purple-600' },
    { name: 'MacBook Pro 13"', width: '1280px', icon: Monitor, color: 'bg-gray-600' },
    { name: 'FHD Screen', width: '1920px', icon: Monitor, color: 'bg-gray-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Header Example */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo - Responsive */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm lg:text-base">R</span>
              </div>
              <span className="text-xl lg:text-2xl font-bold text-gray-900">Responsive Demo</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#breakpoints" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                Breakpoints
              </a>
              <a href="#components" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                Components
              </a>
              <a href="#utilities" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                Utilities
              </a>
            </nav>

            {/* Desktop Search */}
            <div className="hidden lg:block flex-1 max-w-md mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-red-600 transition-colors touch-target"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 p-4">
            <div className="space-y-4">
              <a href="#breakpoints" className="block text-gray-700 hover:text-red-600 transition-colors">
                Breakpoints
              </a>
              <a href="#components" className="block text-gray-700 hover:text-red-600 transition-colors">
                Components
              </a>
              <a href="#utilities" className="block text-gray-700 hover:text-red-600 transition-colors">
                Utilities
              </a>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section - Responsive */}
        <section className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
            Responsive Design
            <span className="text-red-600 block sm:inline"> Showcase</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            This component demonstrates comprehensive responsive design patterns for all device sizes from 320px to 1440px+.
          </p>
        </section>

        {/* Breakpoints Section */}
        <section id="breakpoints" className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 text-center">
            Responsive Breakpoints
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {deviceInfo.map((device, index) => (
              <Card key={index} className="p-4 sm:p-6 text-center group hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full ${device.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <device.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{device.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 font-mono">{device.width}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Responsive Grid Examples */}
        <section id="components" className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 text-center">
            Responsive Components
          </h2>

          {/* Grid System */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Grid System</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center">
                  <span className="text-sm sm:text-base font-medium text-red-800">Item {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Scale */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Typography Scale</h3>
            <div className="space-y-2 sm:space-y-4">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600">
                <span className="font-semibold">Responsive Text:</span> This text scales from xs to xl across breakpoints
              </p>
              <p className="text-responsive text-gray-800">
                <span className="font-semibold">Fluid Text:</span> This text uses clamp() for smooth scaling
              </p>
            </div>
          </div>

          {/* Button Examples */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Responsive Buttons</h3>
            <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
              <Button variant="primary" size="sm" className="btn-mobile sm:btn-tablet lg:btn-desktop">
                Mobile First
              </Button>
              <Button variant="secondary" size="sm" className="btn-mobile sm:btn-tablet lg:btn-desktop">
                Responsive
              </Button>
              <Button variant="ghost" size="sm" className="btn-mobile sm:btn-tablet lg:btn-desktop">
                Design
              </Button>
            </div>
          </div>

          {/* Card Examples */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Responsive Cards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="card-mobile sm:card-tablet lg:card-desktop">
                  <div className="p-4 sm:p-6 lg:p-8">
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                      Card {i + 1}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      This card demonstrates responsive padding and spacing.
                    </p>
                    <Button variant="primary" size="sm">
                      Action
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Responsive Utilities */}
        <section id="utilities" className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 text-center">
            Responsive Utilities
          </h2>

          {/* Spacing Utilities */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Spacing Utilities</h3>
            <div className="space-responsive">
              <div className="bg-blue-100 p-responsive rounded-lg">
                <p className="text-sm sm:text-base">Responsive padding (p-responsive)</p>
              </div>
              <div className="bg-green-100 px-responsive py-responsive rounded-lg">
                <p className="text-sm sm:text-base">Responsive padding X & Y (px-responsive, py-responsive)</p>
              </div>
              <div className="bg-yellow-100 m-responsive rounded-lg">
                <p className="text-sm sm:text-base">Responsive margin (m-responsive)</p>
              </div>
            </div>
          </div>

          {/* Text Utilities */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Text Utilities</h3>
            <div className="space-y-4">
              <p className="text-responsive-xs bg-gray-100 p-4 rounded-lg">
                Responsive text XS to Base (text-responsive-xs)
              </p>
              <p className="text-responsive-sm bg-gray-100 p-4 rounded-lg">
                Responsive text SM to LG (text-responsive-sm)
              </p>
              <p className="text-responsive-base bg-gray-100 p-4 rounded-lg">
                Responsive text Base to XL (text-responsive-base)
              </p>
              <p className="text-responsive-lg bg-gray-100 p-4 rounded-lg">
                Responsive text LG to 2XL (text-responsive-lg)
              </p>
            </div>
          </div>

          {/* Device-Specific Utilities */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Device-Specific Utilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-red-100 p-4 rounded-lg mobile-only">
                <p className="text-sm font-medium">Mobile Only</p>
                <p className="text-xs text-gray-600">Hidden on tablet+</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg tablet-only">
                <p className="text-sm font-medium">Tablet Only</p>
                <p className="text-xs text-gray-600">Hidden on mobile & desktop</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg desktop-only">
                <p className="text-sm font-medium">Desktop Only</p>
                <p className="text-xs text-gray-600">Hidden on mobile & tablet</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg mobile-tablet">
                <p className="text-sm font-medium">Mobile & Tablet</p>
                <p className="text-xs text-gray-600">Hidden on desktop</p>
              </div>
            </div>
          </div>

          {/* Touch Targets */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Touch-Friendly Design</h3>
            <div className="flex flex-wrap gap-4">
              <button className="touch-target bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Touch Target (44px)
              </button>
              <button className="touch-target bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Minimum Size
              </button>
              <button className="touch-target bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Mobile Friendly
              </button>
            </div>
          </div>
        </section>

        {/* Performance Indicators */}
        <section className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 text-center">
            Performance & Accessibility
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Mobile Optimized</h3>
              <ul className="text-sm sm:text-base text-gray-600 space-y-2">
                <li>• Touch-friendly targets (44px+)</li>
                <li>• Reduced motion on mobile</li>
                <li>• Optimized touch interactions</li>
                <li>• Safe area support</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Performance</h3>
              <ul className="text-sm sm:text-base text-gray-600 space-y-2">
                <li>• Responsive images</li>
                <li>• Optimized animations</li>
                <li>• Efficient re-renders</li>
                <li>• Lazy loading support</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Accessibility</h3>
              <ul className="text-sm sm:text-base text-gray-600 space-y-2">
                <li>• Keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
                <li>• Color contrast compliance</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Current Breakpoint Indicator */}
        <section className="text-center">
          <Card className="p-6 sm:p-8 lg:p-10 bg-gradient-to-r from-red-50 to-blue-50">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
              Current Breakpoint
            </h3>
            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
              <MonitorSmartphone className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              <span className="text-sm sm:text-base lg:text-lg font-mono text-gray-800">
                {typeof window !== 'undefined' && window.innerWidth < 640 ? 'Mobile (xs)' :
                 window.innerWidth < 768 ? 'Mobile (sm)' :
                 window.innerWidth < 1024 ? 'Tablet (md)' :
                 window.innerWidth < 1280 ? 'Desktop (lg)' :
                 window.innerWidth < 1440 ? 'Large Desktop (xl)' :
                 'Extra Large (2xl+)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Resize your browser to see responsive behavior
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}; 