'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon, UserIcon, MenuIcon, GlobeIcon, DollarSignIcon, XIcon, SearchIcon, HomeIcon, PackageIcon, InfoIcon, PhoneIcon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppUI, useAppActions } from '@/stores/useAppStore';
import { useToggle } from '@/hooks/useLocalState';

export const Header = () => {
  const { getCartCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { sidebarOpen } = useAppUI();
  const { setSidebarOpen } = useAppActions();
  const { state: isScrolled, setState: setIsScrolled } = useToggle(false);
  const { state: isMenuOpen, toggle: toggleMenu } = useToggle(false);
  const { state: isSearchOpen, toggle: toggleSearch } = useToggle(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsScrolled]);

  const getDashboardLink = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'supplier':
        return '/dashboard/supplier';
      default:
        return '/dashboard/user';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="bg-white p-4 safe-area-top">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search Products</h2>
              <button
                onClick={toggleSearch}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                autoFocus
              />
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
      }`}>
        {/* Top Bar - Desktop Only */}
        <div className="hidden lg:block bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-10 text-sm text-gray-600">
              <div className="flex items-center space-x-6">
                <span>📞 +1 (555) 123-4567</span>
                <span>📧 support@nubiago.com</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <DollarSignIcon className="w-4 h-4" />
                  <span>USD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GlobeIcon className="w-4 h-4" />
                  <span>EN</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm lg:text-base">N</span>
              </div>
              <span className="text-xl lg:text-2xl font-bold text-gray-900">Nubiago</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/products" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                Products
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                Categories
              </Link>
              <Link href="/about-us" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                About
              </Link>
              <Link href="/contact-us" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
                Contact
              </Link>
            </nav>

            {/* Desktop Search Bar */}
            <div className="hidden lg:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Mobile Search Button */}
              <button
                onClick={toggleSearch}
                className="lg:hidden p-2 text-gray-700 hover:text-red-600 transition-colors touch-target"
              >
                <SearchIcon className="w-6 h-6" />
              </button>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-red-600 transition-colors touch-target">
                <ShoppingCartIcon className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {getCartCount() > 99 ? '99+' : getCartCount()}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-red-600 transition-colors touch-target"
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="hidden sm:block text-sm font-medium">{isAuthenticated ? user?.name : 'Account'}</span>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                    {isAuthenticated ? (
                      <>
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={toggleMenu}
                        >
                          <PackageIcon className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={toggleMenu}
                        >
                          <UserIcon className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={toggleMenu}
                        >
                          <PackageIcon className="w-4 h-4 mr-3" />
                          Orders
                        </Link>
                        <hr className="my-2" />
                        <button
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={toggleMenu}
                        >
                          <XIcon className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={toggleMenu}
                        >
                          <UserIcon className="w-4 h-4 mr-3" />
                          Login
                        </Link>
                        <Link
                          href="/register"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={toggleMenu}
                        >
                          <UserIcon className="w-4 h-4 mr-3" />
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-red-600 transition-colors touch-target"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-30">
          <div className="flex items-center justify-around py-2">
            <Link href="/" className="flex flex-col items-center p-2 text-gray-600 hover:text-red-600 transition-colors">
              <HomeIcon className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/products" className="flex flex-col items-center p-2 text-gray-600 hover:text-red-600 transition-colors">
              <PackageIcon className="w-5 h-5 mb-1" />
              <span className="text-xs">Products</span>
            </Link>
            <Link href="/categories" className="flex flex-col items-center p-2 text-gray-600 hover:text-red-600 transition-colors">
              <PackageIcon className="w-5 h-5 mb-1" />
              <span className="text-xs">Categories</span>
            </Link>
            <Link href="/contact-us" className="flex flex-col items-center p-2 text-gray-600 hover:text-red-600 transition-colors">
              <PhoneIcon className="w-5 h-5 mb-1" />
              <span className="text-xs">Contact</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-50 safe-area-top">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <Link
                href="/products"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <PackageIcon className="w-5 h-5 mr-3" />
                Products
              </Link>
              <Link
                href="/categories"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <PackageIcon className="w-5 h-5 mr-3" />
                Categories
              </Link>
              <Link
                href="/about-us"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <InfoIcon className="w-5 h-5 mr-3" />
                About
              </Link>
              <Link
                href="/contact-us"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <PhoneIcon className="w-5 h-5 mr-3" />
                Contact
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-20"></div>
    </>
  );
};