/**
 * Custom Hooks Collection - Optimized
 * Performance-optimized React hooks for common patterns
 */

import { messageAPI, productAPI } from '@/services/api-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Debounce hook for search and input delays
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Optimized data fetching hook with caching
 */
interface UseFetchOptions {
  skip?: boolean;
  cache?: boolean;
  refetchInterval?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(
  fetchFn: () => Promise<any>,
  deps: any[] = [],
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (options.skip) return;

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn();

      if (isMountedRef.current) {
        setData(result.data || result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, options.skip]);

  useEffect(() => {
    fetch();

    // Set up refetch interval if provided
    let intervalId: NodeJS.Timeout | null = null;
    if (options.refetchInterval && options.refetchInterval > 0) {
      intervalId = setInterval(fetch, options.refetchInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [...deps, fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Pagination hook
 */
interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [page, setPage] = useState(options.initialPage || 1);
  const [limit, setLimit] = useState(options.initialLimit || 20);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    reset,
    offset: (page - 1) * limit,
  };
}

/**
 * Products hook with pagination and search
 */
interface UseProductsOptions {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { page = 1, limit = 20, category, search } = options;
  const debouncedSearch = useDebounce(search, 500);

  const fetchProducts = useCallback(async () => {
    return productAPI.browse({
      page,
      limit,
      ...(category && { category }),
      ...(debouncedSearch && { search: debouncedSearch }),
    });
  }, [page, limit, category, debouncedSearch]);

  return useFetch(fetchProducts, [page, limit, category, debouncedSearch]);
}

/**
 * Single product hook
 */
export function useProduct(productId: string | null) {
  const fetchProduct = useCallback(async () => {
    if (!productId) throw new Error('Product ID required');
    return productAPI.getById(productId);
  }, [productId]);

  return useFetch(fetchProduct, [productId], { skip: !productId });
}

/**
 * Messages/Conversations hook
 */
export function useConversations() {
  const fetchConversations = useCallback(async () => {
    return messageAPI.getConversations();
  }, []);

  return useFetch(fetchConversations, [], { refetchInterval: 30000 }); // Refresh every 30s
}

/**
 * Local storage hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

/**
 * Window size hook
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = useMemo(() => windowSize.width < 768, [windowSize.width]);
  const isTablet = useMemo(
    () => windowSize.width >= 768 && windowSize.width < 1024,
    [windowSize.width]
  );
  const isDesktop = useMemo(() => windowSize.width >= 1024, [windowSize.width]);

  return { ...windowSize, isMobile, isTablet, isDesktop };
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Copy to clipboard hook
 */
export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return { copiedText, copy };
}

/**
 * Async operation hook with loading state
 */
export function useAsync<T extends (...args: any[]) => Promise<any>>(asyncFunction: T) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  return { execute, loading, error };
}
