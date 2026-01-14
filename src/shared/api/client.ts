/**
 * Enhanced API Client
 * Centralized HTTP client with error handling, retries, and interceptors
 */

import { API_CONFIG, ERROR_MESSAGES, STORAGE_KEYS } from '@/shared/constants/app-constants';
import { ApiError, ApiResponse } from '@/shared/types';
import { retry, storage } from '@/shared/utils/helpers';

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    config: {
      baseURL?: string;
      timeout?: number;
      retryAttempts?: number;
      retryDelay?: number;
    } = {}
  ) {
    this.baseURL = config.baseURL || API_CONFIG.BASE_URL;
    this.timeout = config.timeout || API_CONFIG.TIMEOUT;
    this.retryAttempts = config.retryAttempts || API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = config.retryDelay || API_CONFIG.RETRY_DELAY;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    // Network error
    if (!error.response) {
      throw {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK_ERROR,
        details: error,
        timestamp: new Date().toISOString(),
      } as ApiError;
    }

    // HTTP error
    const status = error.status || error.response?.status;
    const data = error.data || error.response?.data;

    let message: string = ERROR_MESSAGES.GENERIC_ERROR;
    let code: string = 'UNKNOWN_ERROR';

    switch (status) {
      case 400:
        message = data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
        code = 'VALIDATION_ERROR';
        break;
      case 401:
        message = ERROR_MESSAGES.UNAUTHORIZED;
        code = 'UNAUTHORIZED';
        this.handleUnauthorized();
        break;
      case 403:
        message = ERROR_MESSAGES.FORBIDDEN;
        code = 'FORBIDDEN';
        break;
      case 404:
        message = ERROR_MESSAGES.NOT_FOUND;
        code = 'NOT_FOUND';
        break;
      case 500:
        message = ERROR_MESSAGES.SERVER_ERROR;
        code = 'SERVER_ERROR';
        break;
      default:
        message = data?.message || ERROR_MESSAGES.GENERIC_ERROR;
        code = data?.code || 'UNKNOWN_ERROR';
    }

    throw {
      code,
      message,
      details: data,
      timestamp: new Date().toISOString(),
    } as ApiError;
  }

  /**
   * Handle unauthorized access
   */
  private handleUnauthorized(): void {
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);

    // Redirect to auth page if not already there
    if (!window.location.pathname.includes('/auth')) {
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    shouldRetry: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint);
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const fetchWithTimeout = async (): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    try {
      const makeRequest = async (): Promise<ApiResponse<T>> => {
        const response = await fetchWithTimeout();

        // Parse response
        let data: any;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Handle error responses
        if (!response.ok) {
          this.handleError({ status: response.status, data });
        }

        // Return successful response
        return {
          success: true,
          data: data.data || data,
          message: data.message,
        };
      };

      // Retry on failure for GET requests or if explicitly enabled
      if (shouldRetry && (options.method === 'GET' || !options.method)) {
        return await retry(makeRequest, {
          attempts: this.retryAttempts,
          delay: this.retryDelay,
        });
      }

      return await makeRequest();
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Already formatted error
      }
      this.handleError(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(endpoint + queryString, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      false
    );
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      false
    );
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      false
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, false);
  }

  /**
   * Upload file(s)
   */
  async upload<T>(
    endpoint: string,
    files: File | File[],
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    // Add files
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append('files', file);
      });
    } else {
      formData.append('file', files);
    }

    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    const url = this.buildURL(endpoint);
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        this.handleError({ status: response.status, data });
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      this.handleError(error);
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => apiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, data?: any) => apiClient.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: any) => apiClient.put<T>(endpoint, data),
  patch: <T>(endpoint: string, data?: any) => apiClient.patch<T>(endpoint, data),
  delete: <T>(endpoint: string) => apiClient.delete<T>(endpoint),
  upload: <T>(endpoint: string, files: File | File[], additionalData?: Record<string, any>) =>
    apiClient.upload<T>(endpoint, files, additionalData),
};

/**
 * Authenticated fetch helper for direct fetch API calls
 */
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  const baseURL = API_CONFIG.BASE_URL;
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export default api;
