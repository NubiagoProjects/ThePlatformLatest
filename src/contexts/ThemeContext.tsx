'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { settingsStorage } from '@/lib/storage'

// Types
type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  isLoading: boolean
}

// Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      setIsDark(systemTheme === 'dark')
    } else {
      root.classList.add(theme)
      setIsDark(theme === 'dark')
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(e.matches ? 'dark' : 'light')
        setIsDark(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = settingsStorage.get<Theme>('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [])

  // Save theme to storage
  const handleSetTheme = (newTheme: Theme) => {
    try {
      setTheme(newTheme);
      settingsStorage.set('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
    }
  }

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    isDark,
    isLoading,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 