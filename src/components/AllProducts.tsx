'use client'

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchIcon, FilterIcon, GridIcon, ListIcon, StarIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

// Enhanced sample product data
const products = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    price: 79.99,
    originalPrice: 99.99,
    rating: 4.5,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    brand: 'AudioTech',
    inStock: true,
    tags: ['wireless', 'bluetooth', 'noise-cancelling']
  },
  {
    id: '2',
    name: 'Cotton T-Shirt',
    category: 'Clothing',
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.2,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    brand: 'FashionCo',
    inStock: true,
    tags: ['cotton', 'casual', 'comfortable']
  },
  {
    id: '3',
    name: 'Modern Coffee Table',
    category: 'Furniture',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.7,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80',
    brand: 'HomeStyle',
    inStock: true,
    tags: ['modern', 'wooden', 'living-room']
  },
  {
    id: '4',
    name: 'Stainless Steel Cookware Set',
    category: 'Home & Kitchen',
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.8,
    reviewCount: 203,
    image: 'https://images.unsplash.com/photo-1584990347449-a40bb3b22066?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    brand: 'KitchenPro',
    inStock: true,
    tags: ['stainless-steel', 'cooking', 'professional']
  },
  {
    id: '5',
    name: 'Facial Skincare Set',
    category: 'Beauty',
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.4,
    reviewCount: 167,
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    brand: 'BeautyGlow',
    inStock: true,
    tags: ['skincare', 'facial', 'natural']
  },
  {
    id: '6',
    name: 'Smart Fitness Watch',
    category: 'Electronics',
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.6,
    reviewCount: 234,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    brand: 'FitTech',
    inStock: true,
    tags: ['smartwatch', 'fitness', 'health-tracking']
  },
  {
    id: '7',
    name: 'Premium Coffee Maker',
    category: 'Home & Kitchen',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.3,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    brand: 'BrewMaster',
    inStock: false,
    tags: ['coffee', 'premium', 'automatic']
  },
  {
    id: '8',
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.6,
    reviewCount: 203,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    brand: 'SoundPro',
    inStock: true,
    tags: ['wireless', 'earbuds', 'bluetooth']
  }
];

const categories = ['Electronics', 'Clothing', 'Furniture', 'Home & Kitchen', 'Beauty'];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name: A to Z' }
];

export const AllProducts = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  const itemsPerPage = 12;

  // Initialize state from URL parameters
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = searchParams.get('page');
    
    if (search) {
      setSearchQuery(search);
      setDebouncedSearchQuery(search);
    }
    if (category) {
      setSelectedCategory(category);
    }
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get unique brands and tags
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand))];
    return uniqueBrands.sort();
  }, []);

  const allTags = useMemo(() => {
    const tags = products.flatMap(p => p.tags);
    const uniqueTags = [...new Set(tags)];
    return uniqueTags.sort();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      const matchesSearch = debouncedSearchQuery 
        ? product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          product.tags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
        : true;
      const matchesPriceRange = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesBrands = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => product.tags.includes(tag));
      const matchesStock = showOutOfStock || product.inStock;

      return matchesCategory && matchesSearch && matchesPriceRange && matchesBrands && matchesTags && matchesStock;
    });

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      default:
        // Featured - keep original order
        break;
    }

    return filtered;
  }, [debouncedSearchQuery, selectedCategory, priceRange, sortBy, selectedBrands, selectedTags, showOutOfStock]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/products${newUrl}`, { scroll: false });
  }, [debouncedSearchQuery, selectedCategory, currentPage, router]);

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      quantity: 1,
      inStock: product.inStock,
    });
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 1000]);
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedTags([]);
    setShowOutOfStock(true);
    setCurrentPage(1);
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-2">
            Browse our collection of quality products
          </p>
          {/* Show search results info */}
          {debouncedSearchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Search results for: <span className="font-medium">"{debouncedSearchQuery}"</span>
              {selectedCategory && (
                <span> in <span className="font-medium">{selectedCategory}</span></span>
              )}
              <span> ({filteredProducts.length} products found)</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Search products, brands, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-5 pr-12 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-600">
            <SearchIcon size={20} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Mobile Toggle */}
          <div className="lg:hidden mb-4">
            <button
              className="w-full flex items-center justify-center gap-2 bg-white py-2 px-4 rounded-md border border-gray-300"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon size={18} />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
          </div>

          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-1/4 lg:w-1/5`}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button className="lg:hidden text-gray-500" onClick={() => setShowFilters(false)}>
                  <XIcon size={18} />
                </button>
              </div>

              {/* Categories Filter */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="all-categories"
                      name="category"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="all-categories" className="ml-2 text-gray-700">
                      All Categories
                    </label>
                  </div>
                  {categories.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="radio"
                        id={category}
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor={category} className="ml-2 text-gray-700">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brands Filter */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Brands</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {brands.map(brand => (
                    <div key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrands([...selectedBrands, brand]);
                          } else {
                            setSelectedBrands(selectedBrands.filter(b => b !== brand));
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor={`brand-${brand}`} className="ml-2 text-gray-700 text-sm">
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Tags</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allTags.map(tag => (
                    <div key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag]);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor={`tag-${tag}`} className="ml-2 text-gray-700 text-sm">
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Price Range</h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Stock Filter */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-out-of-stock"
                    checked={showOutOfStock}
                    onChange={(e) => setShowOutOfStock(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="show-out-of-stock" className="ml-2 text-gray-700">
                    Show out of stock items
                  </label>
                </div>
              </div>

              <button
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-4/5">
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of{' '}
                <span className="font-medium">{filteredProducts.length}</span> products
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <GridIcon size={18} />
                  </button>
                  <button
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
                <select 
                  className="text-sm border border-gray-300 rounded-md p-1.5"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products */}
            {paginatedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600">
                  {debouncedSearchQuery || selectedCategory ? 
                    `No products found for "${debouncedSearchQuery}"${selectedCategory ? ` in ${selectedCategory}` : ''}. Try adjusting your search terms or filters.` :
                    'Try adjusting your filters or search term.'
                  }
                </p>
                {(debouncedSearchQuery || selectedCategory) && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map(product => (
                  <div key={product.id} className="group">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-medium">Out of Stock</span>
                          </div>
                        )}
                        {product.originalPrice && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-500 mb-1">
                          {product.category} • {product.brand}
                        </div>
                        <Link href={`/product/${product.id}`}>
                          <h3 className="text-gray-800 font-medium mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center mb-2">
                          <StarIcon size={16} className="text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {product.rating} ({product.reviewCount})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.inStock}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedProducts.map(product => (
                  <div key={product.id} className="group">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex">
                        <div className="w-40 h-40 flex-shrink-0 relative">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-grow">
                          <div className="text-xs text-gray-500 mb-1">
                            {product.category} • {product.brand}
                          </div>
                          <Link href={`/product/${product.id}`}>
                            <h3 className="text-lg text-gray-800 font-medium mb-2 group-hover:text-red-600 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center mb-2">
                            <StarIcon size={16} className="text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">
                              {product.rating} ({product.reviewCount})
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-900">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${product.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={!product.inStock}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        currentPage === page
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 