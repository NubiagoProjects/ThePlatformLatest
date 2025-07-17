/**
 * Storage utility library for abstracting localStorage operations
 * Provides type-safe storage with error handling and fallbacks
 */

export interface StorageOptions {
  prefix?: string;
  encrypt?: boolean;
  compress?: boolean;
}

export class StorageManager {
  private prefix: string;
  private encrypt: boolean;
  private compress: boolean;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'nubiago';
    this.encrypt = options.encrypt || false;
    this.compress = options.compress || false;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private encryptData(data: string): string {
    if (!this.encrypt) return data;
    // Simple encryption - in production, use a proper encryption library
    return btoa(data);
  }

  private decryptData(data: string): string {
    if (!this.encrypt) return data;
    // Simple decryption - in production, use a proper encryption library
    return atob(data);
  }

  private compressData(data: string): string {
    if (!this.compress) return data;
    // Simple compression - in production, use a proper compression library
    return data.length > 1000 ? btoa(data) : data;
  }

  private decompressData(data: string): string {
    if (!this.compress) return data;
    // Simple decompression - in production, use a proper compression library
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const serialized = JSON.stringify(value);
      const processed = this.compressData(this.encryptData(serialized));
      localStorage.setItem(this.getKey(key), processed);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof window === 'undefined') return defaultValue || null;
      
      const stored = localStorage.getItem(this.getKey(key));
      if (stored === null) return defaultValue || null;
      
      const decrypted = this.decryptData(stored);
      const decompressed = this.decompressData(decrypted);
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue || null;
    }
  }

  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  has(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      return localStorage.getItem(this.getKey(key)) !== null;
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  }

  size(): number {
    try {
      if (typeof window === 'undefined') return 0;
      
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith(this.prefix)).length;
    } catch (error) {
      console.error('Storage size error:', error);
      return 0;
    }
  }
}

// Pre-configured storage instances
export const authStorage = new StorageManager({ 
  prefix: 'auth', 
  encrypt: true 
});

export const cartStorage = new StorageManager({ 
  prefix: 'cart', 
  compress: true 
});

export const userStorage = new StorageManager({ 
  prefix: 'user', 
  encrypt: true 
});

export const settingsStorage = new StorageManager({ 
  prefix: 'settings' 
});

// Session storage wrapper
export class SessionStorageManager {
  private prefix: string;

  constructor(prefix: string = 'nubiago') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      window.sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Session storage set error:', error);
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof window === 'undefined') return defaultValue || null;
      
      const stored = window.sessionStorage.getItem(this.getKey(key));
      if (stored === null) return defaultValue || null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Session storage get error:', error);
      return defaultValue || null;
    }
  }

  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      window.sessionStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Session storage remove error:', error);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const keys = Object.keys(window.sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          window.sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Session storage clear error:', error);
      return false;
    }
  }
}

export const sessionStorage = new SessionStorageManager();

// Utility functions for common storage operations
export const storageUtils = {
  // Auth utilities
  getAuthToken: () => authStorage.get<string>('token'),
  setAuthToken: (token: string) => authStorage.set('token', token),
  removeAuthToken: () => authStorage.remove('token'),
  
  // User utilities
  getUserData: () => userStorage.get('data'),
  setUserData: (data: any) => userStorage.set('data', data),
  removeUserData: () => userStorage.remove('data'),
  
  // Cart utilities
  getCartData: () => cartStorage.get('items'),
  setCartData: (data: any) => cartStorage.set('items', data),
  removeCartData: () => cartStorage.remove('items'),
  
  // Settings utilities
  getSettings: () => settingsStorage.get('preferences'),
  setSettings: (settings: any) => settingsStorage.set('preferences', settings),
  
  // Session utilities
  getSessionData: (key: string) => sessionStorage.get(key),
  setSessionData: (key: string, data: any) => sessionStorage.set(key, data),
  removeSessionData: (key: string) => sessionStorage.remove(key),
  
  // Clear all data
  clearAll: () => {
    authStorage.clear();
    cartStorage.clear();
    userStorage.clear();
    settingsStorage.clear();
    sessionStorage.clear();
  }
}; 