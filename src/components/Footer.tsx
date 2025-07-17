import React from 'react';
import Link from 'next/link';
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon, GlobeIcon, DollarSignIcon } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">Nubiago</h3>
            <p className="text-gray-400 mb-4">
              Shop everyday essentials from trusted sellers — simple, quick, and
              reliable.
            </p>
            <div className="flex space-x-4">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                <FacebookIcon size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                <TwitterIcon size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <InstagramIcon size={20} />
              </a>
              <a href="#" aria-label="YouTube" className="text-gray-400 hover:text-white transition-colors">
                <YoutubeIcon size={20} />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/help-center" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products?category=Electronics" className="text-gray-400 hover:text-white transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/products?category=Clothing" className="text-gray-400 hover:text-white transition-colors">
                  Apparels
                </Link>
              </li>
              <li>
                <Link href="/products?category=Furniture" className="text-gray-400 hover:text-white transition-colors">
                  Furnitures
                </Link>
              </li>
              <li>
                <Link href="/products?category=Home%20%26%20Kitchen" className="text-gray-400 hover:text-white transition-colors">
                  Home Appliances
                </Link>
              </li>
              <li>
                <Link href="/products?category=Beauty" className="text-gray-400 hover:text-white transition-colors">
                  Cosmetics
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <GlobeIcon size={18} className="mr-2 text-gray-400" />
                <span>Language: English</span>
              </div>
              <div className="flex items-center">
                <DollarSignIcon size={18} className="mr-2 text-gray-400" />
                <span>Currency: USD $</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} Nubiago. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};