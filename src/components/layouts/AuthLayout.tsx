'use client';

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${className}`}>
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nubiago</h1>
          {title && <h2 className="text-xl font-semibold text-gray-700 mb-1">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        
        {/* Auth Form */}
        {children}
      </div>
    </div>
  );
}; 