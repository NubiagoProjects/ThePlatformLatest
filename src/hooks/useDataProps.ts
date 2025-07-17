/**
 * Custom hooks for managing data props
 * Handles routing-passed data and layout-level data with proper TypeScript support
 */

import { useMemo, useCallback } from 'react';
import { useSearchParams, useParams, usePathname } from 'next/navigation';

// Hook for managing URL search parameters as data props
export function useSearchParamsData<T extends Record<string, any>>(
  defaultValues: T,
  parser?: (params: URLSearchParams) => Partial<T>
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const data = useMemo(() => {
    if (!searchParams) return defaultValues;

    if (parser) {
      return { ...defaultValues, ...parser(searchParams) };
    }

    // Default parser for common data types
    const parsed: Partial<T> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key in defaultValues) {
        const defaultValue = defaultValues[key as keyof T];
        
        // Type-aware parsing
        if (typeof defaultValue === 'number') {
          parsed[key as keyof T] = Number(value) as T[keyof T];
        } else if (typeof defaultValue === 'boolean') {
          parsed[key as keyof T] = (value === 'true') as T[keyof T];
        } else if (Array.isArray(defaultValue)) {
          parsed[key as keyof T] = value.split(',') as T[keyof T];
        } else {
          parsed[key as keyof T] = value as T[keyof T];
        }
      }
    }

    return { ...defaultValues, ...parsed };
  }, [searchParams, defaultValues, parser]);

  const updateData = useCallback((updates: Partial<T>) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        newParams.set(key, value.join(','));
      } else {
        newParams.set(key, String(value));
      }
    });

    const newUrl = `${pathname}?${newParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, [searchParams, pathname]);

  const clearData = useCallback(() => {
    window.history.pushState({}, '', pathname);
  }, [pathname]);

  return {
    data,
    updateData,
    clearData,
    searchParams: searchParams?.toString() || '',
  };
}

// Hook for managing route parameters as data props
export function useRouteParamsData<T extends Record<string, any>>(
  defaultValues: T,
  parser?: (params: Record<string, string | string[]>) => Partial<T>
) {
  const params = useParams();

  const data = useMemo(() => {
    if (!params) return defaultValues;

    if (parser) {
      return { ...defaultValues, ...parser(params) };
    }

    // Default parser for route parameters
    const parsed: Partial<T> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key in defaultValues) {
        const defaultValue = defaultValues[key as keyof T];
        
        // Handle array values from catch-all routes
        const paramValue = Array.isArray(value) ? value[0] : value;
        
        // Type-aware parsing
        if (typeof defaultValue === 'number') {
          parsed[key as keyof T] = Number(paramValue) as T[keyof T];
        } else if (typeof defaultValue === 'boolean') {
          parsed[key as keyof T] = (paramValue === 'true') as T[keyof T];
        } else {
          parsed[key as keyof T] = paramValue as T[keyof T];
        }
      }
    }

    return { ...defaultValues, ...parsed };
  }, [params, defaultValues, parser]);

  return {
    data,
    params,
  };
}

// Hook for managing layout-level data props
export function useLayoutData<T>(
  initialData: T,
  key?: string
) {
  const dataKey = key || 'layout-data';
  
  const getData = useCallback((): T => {
    if (typeof window === 'undefined') return initialData;
    
    try {
      const stored = sessionStorage.getItem(dataKey);
      return stored ? JSON.parse(stored) : initialData;
    } catch {
      return initialData;
    }
  }, [dataKey, initialData]);

  const setData = useCallback((newData: T) => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(dataKey, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving layout data:', error);
    }
  }, [dataKey]);

  const clearData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(dataKey);
    } catch (error) {
      console.error('Error clearing layout data:', error);
    }
  }, [dataKey]);

  return {
    data: getData(),
    setData,
    clearData,
  };
}

// Hook for managing page-level data props
export function usePageData<T>(
  initialData: T,
  pageKey?: string
) {
  const pathname = usePathname();
  const key = pageKey || `page-data-${pathname}`;
  
  const getData = useCallback((): T => {
    if (typeof window === 'undefined') return initialData;
    
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialData;
    } catch {
      return initialData;
    }
  }, [key, initialData]);

  const setData = useCallback((newData: T) => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(key, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving page data:', error);
    }
  }, [key]);

  const clearData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing page data:', error);
    }
  }, [key]);

  return {
    data: getData(),
    setData,
    clearData,
  };
}

// Hook for managing form data as props
export function useFormDataProps<T extends Record<string, any>>(
  initialData: T,
  formKey?: string
) {
  const pathname = usePathname();
  const key = formKey || `form-data-${pathname}`;
  
  const getFormData = useCallback((): T => {
    if (typeof window === 'undefined') return initialData;
    
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialData;
    } catch {
      return initialData;
    }
  }, [key, initialData]);

  const setFormData = useCallback((data: Partial<T>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const current = getFormData();
      const updated = { ...current, ...data };
      sessionStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [key, getFormData]);

  const clearFormData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  }, [key]);

  const resetFormData = useCallback(() => {
    setFormData(initialData);
  }, [setFormData, initialData]);

  return {
    formData: getFormData(),
    setFormData,
    clearFormData,
    resetFormData,
  };
}

// Utility hook for managing filter data
export function useFilterData<T extends Record<string, any>>(
  defaultFilters: T
) {
  return useSearchParamsData(defaultFilters, (params) => {
    const filters: Partial<T> = {};
    
    for (const [key, value] of params.entries()) {
      if (key in defaultFilters) {
        const defaultValue = defaultFilters[key as keyof T];
        
        if (typeof defaultValue === 'string') {
          filters[key as keyof T] = value as T[keyof T];
        } else if (typeof defaultValue === 'number') {
          filters[key as keyof T] = Number(value) as T[keyof T];
        } else if (typeof defaultValue === 'boolean') {
          filters[key as keyof T] = (value === 'true') as T[keyof T];
        } else if (Array.isArray(defaultValue)) {
          filters[key as keyof T] = value.split(',') as T[keyof T];
        }
      }
    }
    
    return filters;
  });
}

// Utility hook for managing pagination data
export function usePaginationData(
  defaultPage: number = 1,
  defaultLimit: number = 20
) {
  return useSearchParamsData(
    { page: defaultPage, limit: defaultLimit },
    (params) => ({
      page: Number(params.get('page')) || defaultPage,
      limit: Number(params.get('limit')) || defaultLimit,
    })
  );
} 