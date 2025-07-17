'use client';

import React, { useState } from 'react';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseBadge } from '@/components/ui/BaseBadge';
import { Star, Heart, Share2, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    brand: string;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    features?: string[];
    specifications?: Record<string, string>;
  };
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const { addToCart } = useCart();

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      quantity,
      inStock: product.inStock,
    });
    
    // Show feedback
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);
  };

  const handleAddToWishlist = () => {
    // TODO: Implement add to wishlist functionality
    console.log('Adding to wishlist:', product);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            Click to zoom
          </div>
        </div>
        
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="space-y-6">
        {/* Product Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BaseBadge variant="secondary">{product.category}</BaseBadge>
            {product.originalPrice && (
              <BaseBadge variant="destructive">{discount}% OFF</BaseBadge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          
          <p className="text-gray-600 mb-4">
            by <span className="font-medium">{product.brand}</span>
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xl text-gray-500 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Key Features
            </h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">{key}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase Options */}
        <div className="space-y-4">
          {/* Quantity */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Quantity:</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <BaseButton
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 relative"
              size="lg"
            >
              {showAddedFeedback ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Added to Cart!
                </>
              ) : (
                product.inStock ? 'Add to Cart' : 'Out of Stock'
              )}
            </BaseButton>
            
            <BaseButton
              variant="outline"
              onClick={handleAddToWishlist}
              className="px-4"
            >
              <Heart className="w-5 h-5" />
            </BaseButton>
            
            <BaseButton
              variant="outline"
              onClick={handleShare}
              className="px-4"
            >
              <Share2 className="w-5 h-5" />
            </BaseButton>
          </div>
        </div>

        {/* Shipping & Returns */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Free Shipping</p>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Secure Payment</p>
              <p className="text-sm text-gray-600">100% secure checkout</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Easy Returns</p>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 