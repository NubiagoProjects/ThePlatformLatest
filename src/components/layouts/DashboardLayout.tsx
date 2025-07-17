'use client';

import React from 'react';
import Sidebar from '@/components/dashboard/shared/Sidebar';
import Header from '@/components/dashboard/shared/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'user' | 'supplier' | 'admin';
  user?: { name?: string; email?: string };
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  user,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="flex">
        {/* Sidebar */}
        <Sidebar userRole={userRole} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header {...(user && { user })} />
          
          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}; 