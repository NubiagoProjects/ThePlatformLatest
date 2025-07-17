'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authStorage, userStorage } from '@/lib/storage'

// Types
interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'supplier' | 'admin'
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: RegisterData) => Promise<void>
  clearError: () => void
  updateUser: (userData: Partial<User>) => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: 'user' | 'supplier'
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<User> }

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authStorage.get<string>('token');
        const userData = userStorage.get<User>('data');
        
        if (token && userData) {
          // TODO: Replace with actual API call to validate token
          // For now, we'll trust the stored data
          dispatch({ type: 'AUTH_SUCCESS', payload: userData });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      // Mock authentication
      let user: User;
      
      if (email === 'admin@nubiago.com' && password === 'admin123') {
        user = {
          id: '1',
          email,
          name: 'Admin User',
          role: 'admin',
        };
      } else if (email === 'supplier@nubiago.com' && password === 'supplier123') {
        user = {
          id: '2',
          email,
          name: 'Supplier User',
          role: 'supplier',
        };
      } else if (email === 'user@nubiago.com' && password === 'user123') {
        user = {
          id: '3',
          email,
          name: 'Regular User',
          role: 'user',
        };
      } else {
        throw new Error('Invalid credentials')
      }

      // Store auth data
      authStorage.set('token', 'mock-token');
      userStorage.set('data', user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      })
    }
  }

  // Logout function
  const logout = () => {
    authStorage.remove('token');
    userStorage.remove('data');
    dispatch({ type: 'LOGOUT' })
  }

  // Register function
  const register = async (userData: RegisterData) => {
    dispatch({ type: 'AUTH_START' })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      const user: User = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
      }
      
      // Store auth data
      authStorage.set('token', 'mock-token');
      userStorage.set('data', user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      })
    }
  }

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      userStorage.set('data', updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: userData });
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    clearError,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 