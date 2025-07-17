/**
 * Custom hooks for managing local UI state
 * Provides consistent patterns for useState and useReducer
 */

import { useState, useReducer, useCallback, useRef, useEffect } from 'react';

// Generic state updater type
export type StateUpdater<T> = T | ((prev: T) => T);

// Local state hook with validation
export function useLocalState<T>(
  initialState: T,
  validator?: (value: T) => boolean | string
) {
  const [state, setState] = useState<T>(initialState);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback((updater: StateUpdater<T>) => {
    const newState = typeof updater === 'function' 
      ? (updater as (prev: T) => T)(state)
      : updater;

    if (validator) {
      const validation = validator(newState);
      if (typeof validation === 'string') {
        setError(validation);
        return;
      } else if (!validation) {
        setError('Invalid state value');
        return;
      }
    }

    setError(null);
    setState(newState);
  }, [state, validator]);

  const resetState = useCallback(() => {
    setState(initialState);
    setError(null);
  }, [initialState]);

  return {
    state,
    setState: updateState,
    error,
    resetState,
    isValid: !error
  };
}

// Form state management hook
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type FormAction<T> =
  | { type: 'SET_VALUE'; field: keyof T; value: any }
  | { type: 'SET_ERROR'; field: keyof T; error: string }
  | { type: 'SET_TOUCHED'; field: keyof T; touched: boolean }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET'; initialState: T }
  | { type: 'SET_VALUES'; values: Partial<T> };

export function useFormState<T extends Record<string, any>>(
  initialState: T,
  validator?: (values: T) => Partial<Record<keyof T, string>>
) {
  const formReducer = useCallback((state: FormState<T>, action: FormAction<T>): FormState<T> => {
    switch (action.type) {
      case 'SET_VALUE':
        const newValues = { ...state.values, [action.field]: action.value };
        const newErrors = validator ? validator(newValues) : {};
        return {
          ...state,
          values: newValues,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0
        };

      case 'SET_ERROR':
        return {
          ...state,
          errors: { ...state.errors, [action.field]: action.error },
          isValid: false
        };

      case 'SET_TOUCHED':
        return {
          ...state,
          touched: { ...state.touched, [action.field]: action.touched }
        };

      case 'SET_SUBMITTING':
        return {
          ...state,
          isSubmitting: action.isSubmitting
        };

      case 'RESET':
        return {
          values: action.initialState,
          errors: {},
          touched: {},
          isSubmitting: false,
          isValid: true
        };

      case 'SET_VALUES':
        const updatedValues = { ...state.values, ...action.values };
        const updatedErrors = validator ? validator(updatedValues) : {};
        return {
          ...state,
          values: updatedValues,
          errors: updatedErrors,
          isValid: Object.keys(updatedErrors).length === 0
        };

      default:
        return state;
    }
  }, [validator]);

  const [state, dispatch] = useReducer(formReducer, {
    values: initialState,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true
  });

  const setValue = useCallback((field: keyof T, value: any) => {
    dispatch({ type: 'SET_VALUE', field, value });
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    dispatch({ type: 'SET_ERROR', field, error });
  }, []);

  const setTouched = useCallback((field: keyof T, touched: boolean) => {
    dispatch({ type: 'SET_TOUCHED', field, touched });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', initialState });
  }, [initialState]);

  const setValues = useCallback((values: Partial<T>) => {
    dispatch({ type: 'SET_VALUES', values });
  }, []);

  return {
    ...state,
    setValue,
    setError,
    setTouched,
    setSubmitting,
    reset,
    setValues
  };
}

// Toggle state hook
export function useToggle(initialState: boolean = false) {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => {
    setState(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setState(true);
  }, []);

  const setFalse = useCallback(() => {
    setState(false);
  }, []);

  return {
    state,
    toggle,
    setTrue,
    setFalse,
    setState
  };
}

// Counter state hook
export function useCounter(initialValue: number = 0, min?: number, max?: number) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => {
      if (max !== undefined && prev >= max) return prev;
      return prev + 1;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount(prev => {
      if (min !== undefined && prev <= min) return prev;
      return prev - 1;
    });
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback((value: number) => {
    if (min !== undefined && value < min) return;
    if (max !== undefined && value > max) return;
    setCount(value);
  }, [min, max]);

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
    isMin: min !== undefined ? count <= min : false,
    isMax: max !== undefined ? count >= max : false
  };
}

// Debounced state hook
export function useDebouncedState<T>(
  initialState: T,
  delay: number = 500
) {
  const [state, setState] = useState<T>(initialState);
  const [debouncedState, setDebouncedState] = useState<T>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedState(state);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, delay]);

  return {
    state,
    setState,
    debouncedState
  };
}

// Previous state hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Async state hook
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: null }));
  }, []);

  const setData = useCallback((data: T) => {
    setState({ data, loading: false, error: null });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    setLoading,
    setData,
    setError,
    reset
  };
} 