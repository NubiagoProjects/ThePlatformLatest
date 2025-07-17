/**
 * Global application state management using Zustand
 * Provides centralized state for app-wide data and settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageUtils } from '@/lib/storage';

// App-wide state types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    analytics: boolean;
    marketing: boolean;
    thirdParty: boolean;
  };
}

export interface AppState {
  // UI State
  sidebarOpen: boolean;
  modalOpen: boolean;
  currentModal: string | null;
  toastNotifications: ToastNotification[];
  
  // App Settings
  settings: AppSettings;
  
  // Feature Flags
  features: {
    darkMode: boolean;
    advancedSearch: boolean;
    wishlist: boolean;
    reviews: boolean;
    recommendations: boolean;
  };
  
  // Loading States
  loadingStates: Record<string, boolean>;
  
  // Error States
  errors: Record<string, string>;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
}

// Actions interface
export interface AppActions {
  // UI Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  
  // Toast Actions
  addToast: (toast: Omit<ToastNotification, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Feature Actions
  toggleFeature: (feature: keyof AppState['features']) => void;
  setFeature: (feature: keyof AppState['features'], enabled: boolean) => void;
  
  // Loading Actions
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: (key: string) => void;
  
  // Error Actions
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  // Reset Actions
  resetApp: () => void;
}

// Combined state and actions type
export type AppStore = AppState & AppActions;

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  currency: 'USD',
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
  privacy: {
    analytics: true,
    marketing: false,
    thirdParty: false,
  },
};

// Default state
const defaultState: AppState = {
  sidebarOpen: false,
  modalOpen: false,
  currentModal: null,
  toastNotifications: [],
  settings: defaultSettings,
  features: {
    darkMode: true,
    advancedSearch: true,
    wishlist: true,
    reviews: true,
    recommendations: true,
  },
  loadingStates: {},
  errors: {},
};

// Create the store
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // UI Actions
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      
      openModal: (modalId: string) => set({ 
        modalOpen: true, 
        currentModal: modalId 
      }),
      
      closeModal: () => set({ 
        modalOpen: false, 
        currentModal: null 
      }),

      // Toast Actions
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: ToastNotification = {
          ...toast,
          id,
          createdAt: new Date(),
        };
        
        set(state => ({
          toastNotifications: [...state.toastNotifications, newToast]
        }));

        // Auto-remove toast after duration
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 5000);
        }
      },

      removeToast: (id: string) => set(state => ({
        toastNotifications: state.toastNotifications.filter(toast => toast.id !== id)
      })),

      clearToasts: () => set({ toastNotifications: [] }),

      // Settings Actions
      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings }
      })),

      resetSettings: () => set({ settings: defaultSettings }),

      // Feature Actions
      toggleFeature: (feature) => set(state => ({
        features: {
          ...state.features,
          [feature]: !state.features[feature]
        }
      })),

      setFeature: (feature, enabled) => set(state => ({
        features: {
          ...state.features,
          [feature]: enabled
        }
      })),

      // Loading Actions
      setLoading: (key, loading) => set(state => ({
        loadingStates: {
          ...state.loadingStates,
          [key]: loading
        }
      })),

      clearLoading: (key) => set(state => {
        const newLoadingStates = { ...state.loadingStates };
        delete newLoadingStates[key];
        return { loadingStates: newLoadingStates };
      }),

      // Error Actions
      setError: (key, error) => set(state => ({
        errors: {
          ...state.errors,
          [key]: error
        }
      })),

      clearError: (key) => set(state => {
        const newErrors = { ...state.errors };
        delete newErrors[key];
        return { errors: newErrors };
      }),

      clearAllErrors: () => set({ errors: {} }),

      // Reset Actions
      resetApp: () => {
        set(defaultState);
        storageUtils.clearAll();
      },
    }),
    {
      name: 'nubiago-app-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storageUtils.getSessionData(name);
          return value ? Promise.resolve(value) : Promise.resolve(null);
        },
        setItem: (name, value) => {
          storageUtils.setSessionData(name, value);
          return Promise.resolve();
        },
        removeItem: (name) => {
          storageUtils.removeSessionData(name);
          return Promise.resolve();
        },
      })),
      partialize: (state) => ({
        settings: state.settings,
        features: state.features,
      }),
    }
  )
);

// Selector hooks for better performance
export const useAppSettings = () => useAppStore(state => state.settings);
export const useAppFeatures = () => useAppStore(state => state.features);
export const useAppUI = () => useAppStore(state => ({
  sidebarOpen: state.sidebarOpen,
  modalOpen: state.modalOpen,
  currentModal: state.currentModal,
}));
export const useAppToasts = () => useAppStore(state => state.toastNotifications);
export const useAppLoading = (key: string) => useAppStore(state => state.loadingStates[key] || false);
export const useAppError = (key: string) => useAppStore(state => state.errors[key]);

// Utility hooks
export const useAppActions = () => useAppStore(state => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  openModal: state.openModal,
  closeModal: state.closeModal,
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings,
  toggleFeature: state.toggleFeature,
  setFeature: state.setFeature,
  setLoading: state.setLoading,
  clearLoading: state.clearLoading,
  setError: state.setError,
  clearError: state.clearError,
  clearAllErrors: state.clearAllErrors,
  resetApp: state.resetApp,
})); 