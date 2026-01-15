/**
 * Optimized API Client with Request Interceptors
 * Centralized HTTP client with caching, retry logic, and error handling
 *
 * Features:
 * - Automatic token refresh
 * - Request/response interceptors
 * - Client-side caching
 * - Retry logic for failed requests
 * - Request deduplication
 */

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Types
interface CacheEntry {
  data: any;
  expiresAt: number;
}

interface RequestOptions extends RequestInit {
  skipCache?: boolean;
}

interface APIError extends Error {
  status?: number;
  data?: any;
}

// Simple in-memory cache
class APICache {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map<string, CacheEntry>();
  }

  generateKey(url: string, options: RequestOptions = {}): string {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${body}`;
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any, ttl: number = CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();

// Pending requests to prevent duplicate calls
const pendingRequests = new Map<string, Promise<Response>>();

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * Clear authentication data
 */
export const clearAuth = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  apiCache.clear();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Handle API response
 */
const handleResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  const isJSON = contentType && contentType.includes('application/json');

  const data = isJSON ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(data.message || data || 'An error occurred') as APIError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await handleResponse(response);

    if (data.data?.accessToken) {
      setAuthToken(data.data.accessToken);
      return data.data.accessToken;
    }

    throw new Error('Failed to refresh token');
  } catch (error) {
    clearAuth();
    window.location.href = '/auth';
    throw error;
  }
};

/**
 * Make authenticated API request with retry logic
 */
export const authFetch = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  const token = getAuthToken();
  const method = options.method || 'GET';

  // Check cache for GET requests
  if (method === 'GET' && !options.skipCache) {
    const cacheKey = apiCache.generateKey(url, options);
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return Promise.resolve({ json: async () => cached } as Response);
    }
  }

  // Check for pending duplicate requests
  const requestKey = `${method}:${url}`;
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }

  const fetchRequest = async (retryCount: number = 0): Promise<Response> => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        } as HeadersInit,
      });

      // Token expired - refresh and retry
      if (response.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return fetchRequest(1); // Retry with new token
      }

      // Cache successful GET responses
      if (method === 'GET' && response.ok && !options.skipCache) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        const cacheKey = apiCache.generateKey(url, options);
        apiCache.set(cacheKey, data);
      }

      // Invalidate cache for mutations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const pattern = url.split('?')[0].split('/')[1]; // Get resource name
        apiCache.invalidate(pattern);
      }

      return response;
    } catch (error) {
      // Retry on network error (max 2 retries)
      if (retryCount < 2 && error.message.includes('Failed to fetch')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchRequest(retryCount + 1);
      }
      throw error;
    } finally {
      pendingRequests.delete(requestKey);
    }
  };

  const promise = fetchRequest();
  pendingRequests.set(requestKey, promise);

  return promise;
};

/**
 * Authentication API
 */
export const authAPI = {
  register: async (
    email: string,
    password: string,
    displayName: string,
    userType: string = 'buyer'
  ): Promise<any> => {
    const response = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, userType }),
    });

    const data = await handleResponse(response);

    if (data.data?.tokens?.accessToken) {
      setAuthToken(data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    }

    return data;
  },

  login: async (email: string, password: string): Promise<any> => {
    const response = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(response);

    if (data.data?.tokens?.accessToken) {
      setAuthToken(data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    }

    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        await authFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    clearAuth();
  },

  getMe: async (): Promise<any> => {
    const response = await authFetch('/auth/me');
    return handleResponse(response);
  },

  refreshToken: async (): Promise<string> => {
    return refreshAccessToken();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    const response = await authFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },
};

/**
 * Profile API
 */
export const profileAPI = {
  getProfile: async (): Promise<any> => {
    const response = await authFetch('/profile');
    return handleResponse(response);
  },

  updateProfile: async (updates: Record<string, any>): Promise<any> => {
    const response = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  uploadAvatar: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      } as HeadersInit,
      body: formData,
    });

    return handleResponse(response);
  },

  searchProfiles: async (query: string): Promise<any> => {
    const response = await authFetch(`/profile/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },
};

/**
 * Product API
 */
export const productAPI = {
  browse: async (params: Record<string, any> = {}): Promise<any> => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await authFetch(`/products/browse${queryString ? `?${queryString}` : ''}`);
    return handleResponse(response);
  },

  getById: async (id: string): Promise<any> => {
    const response = await authFetch(`/products/${id}`);
    return handleResponse(response);
  },

  create: async (formData: FormData): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      } as HeadersInit,
      body: formData, // FormData for file uploads
    });

    return handleResponse(response);
  },

  update: async (id: string, updates: Record<string, any>): Promise<any> => {
    const response = await authFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<any> => {
    const response = await authFetch(`/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getMyProducts: async (page: number = 1, limit: number = 20): Promise<any> => {
    const response = await authFetch(`/products/my-products?page=${page}&limit=${limit}`);
    return handleResponse(response);
  },

  favorite: async (id: string): Promise<any> => {
    const response = await authFetch(`/products/${id}/favorite`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  unfavorite: async (id: string): Promise<any> => {
    const response = await authFetch(`/products/${id}/favorite`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getFavorites: async (): Promise<any> => {
    const response = await authFetch('/products/favorites');
    return handleResponse(response);
  },
};

/**
 * Message API
 */
export const messageAPI = {
  send: async (receiverId: string, productId: string, content: string): Promise<any> => {
    const response = await authFetch('/buyers/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, productId, content }),
    });
    return handleResponse(response);
  },

  getConversations: async (): Promise<any> => {
    const response = await authFetch('/buyers/messages/conversations');
    return handleResponse(response);
  },

  getConversation: async (userId: string): Promise<any> => {
    const response = await authFetch(`/buyers/messages/conversation/${userId}`);
    return handleResponse(response);
  },

  markAsRead: async (messageId: string): Promise<any> => {
    const response = await authFetch(`/buyers/messages/${messageId}/read`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },
};

/**
 * Admin API
 */
export const adminAPI = {
  getDashboardStats: async (): Promise<any> => {
    const response = await authFetch('/admin/dashboard/stats');
    return handleResponse(response);
  },

  getUsers: async (params: Record<string, any> = {}): Promise<any> => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await authFetch(`/admin/users${queryString ? `?${queryString}` : ''}`);
    return handleResponse(response);
  },

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    const response = await authFetch(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  suspendUser: async (userId: string, reason: string): Promise<any> => {
    const response = await authFetch(`/admin/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  deleteProduct: async (productId: string): Promise<any> => {
    const response = await authFetch(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export { apiCache };
