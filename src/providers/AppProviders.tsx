'use client';

import React from 'react';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <FirebaseAuthProvider>
      <ThemeProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ThemeProvider>
    </FirebaseAuthProvider>
  );
};

export default AppProviders; 