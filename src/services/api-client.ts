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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured');
}
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
const pendingRequests = new Map<string, Promise<Response>>();

export const clearAuth = (): void => {
  apiCache.clear();
};

const handleResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  const isJSON = contentType && contentType.includes('application/json');

  const data = isJSON ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error((data as any)?.message || data || 'An error occurred') as APIError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const refreshAccessToken = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(response);
  } catch (error) {
    clearAuth();
    throw error;
  }
};

export const authFetch = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  const method = options.method || 'GET';
  const normalizedUrl = url.split('?')[0];

  if (method === 'GET' && !options.skipCache) {
    const cacheKey = apiCache.generateKey(url, options);
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return Promise.resolve({ json: async () => cached } as Response);
    }
  }

  const requestKey = `${method}:${url}`;
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }

  const fetchRequest = async (retryCount: number = 0): Promise<Response> => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        } as HeadersInit,
      });

      if (response.status === 401 && retryCount === 0 && !normalizedUrl.startsWith('/auth/')) {
        await refreshAccessToken();
        return fetchRequest(1);
      }

      if (method === 'GET' && response.ok && !options.skipCache) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        const cacheKey = apiCache.generateKey(url, options);
        apiCache.set(cacheKey, data);
      }

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const pattern = url.split('?')[0].split('/')[1];
        apiCache.invalidate(pattern);
      }

      return response;
    } catch (error: any) {
      if (retryCount < 2 && String(error?.message || '').includes('Failed to fetch')) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
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

    return handleResponse(response);
  },

  login: async (email: string, password: string): Promise<any> => {
    const response = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return handleResponse(response);
  },

  logout: async (): Promise<void> => {
    try {
      await authFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearAuth();
    }
  },

  getMe: async (): Promise<any> => {
    const response = await authFetch('/auth/me');
    return handleResponse(response);
  },

  refreshToken: async (): Promise<void> => {
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

    const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    return handleResponse(response);
  },

  searchProfiles: async (query: string): Promise<any> => {
    const response = await authFetch(`/profile/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },
};

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
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
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
    const response = await authFetch(`/products/${id}`, { method: 'DELETE' });
    return handleResponse(response);
  },

  getMyProducts: async (page: number = 1, limit: number = 20): Promise<any> => {
    const response = await authFetch(`/products/my-products?page=${page}&limit=${limit}`);
    return handleResponse(response);
  },

  favorite: async (id: string): Promise<any> => {
    const response = await authFetch(`/products/${id}/favorite`, { method: 'POST' });
    return handleResponse(response);
  },

  unfavorite: async (id: string): Promise<any> => {
    const response = await authFetch(`/products/${id}/favorite`, { method: 'DELETE' });
    return handleResponse(response);
  },

  getFavorites: async (): Promise<any> => {
    const response = await authFetch('/products/favorites/my-list');
    return handleResponse(response);
  },

  // Backward-compatible methods
  searchProducts: async (query: string, filters: Record<string, any> = {}): Promise<any> => {
    return productAPI.browse({ ...filters, search: query });
  },

  browseProducts: async (filters: Record<string, any> = {}): Promise<any> => {
    return productAPI.browse(filters);
  },
};

// Aliases for backward compatibility
export const productsAPI = productAPI;

export const messageAPI = {
  // Primary method (new signature)
  send: async (receiverId: string, productId: string, content: string): Promise<any> => {
    const response = await authFetch('/buyers/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, productId, content }),
    });
    return handleResponse(response);
  },

  // Backward-compatible alias used by ProductDetail and CategoryPage
  sendMessage: async (receiverId: string, subject: string, message: string): Promise<any> => {
    const response = await authFetch('/buyers/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, subject, message }),
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

  // Backward-compatible alias used by MessagesView
  getMessages: async (conversationWith: string | null = null, page: number = 1, limit: number = 20): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(conversationWith && { conversation_with: conversationWith }),
    });
    const response = await authFetch(`/buyers/messages?${params}`);
    return handleResponse(response);
  },

  markAsRead: async (messageId: string): Promise<any> => {
    const response = await authFetch(`/buyers/messages/${messageId}/read`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  // Reply to a message
  replyToMessage: async (messageId: string, messageBody: string): Promise<any> => {
    const response = await authFetch(`/buyers/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message_body: messageBody }),
    });
    return handleResponse(response);
  },
};


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
    const response = await authFetch(`/admin/products/${productId}`, { method: 'DELETE' });
    return handleResponse(response);
  },
};

export { apiCache };

