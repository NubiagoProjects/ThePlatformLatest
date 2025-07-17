import React from 'react';
import { SendIcon } from 'lucide-react';
export const Newsletter = () => {
  return <section className="py-16 bg-[#0052CC] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="mb-8">
            Stay updated with exclusive deals and product drops.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="email" placeholder="Your email address" className="flex-grow py-3 px-4 rounded-lg focus:outline-none text-gray-800" aria-label="Email address" />
            <button className="bg-white text-[#0052CC] py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
              Subscribe
              <SendIcon size={18} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </section>;
};