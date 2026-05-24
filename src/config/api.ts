/**
 * API Configuration
 * Handles API base URL for different environments
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured');
}

const TRANSPORT_INTEGRATION_BASE_URL = import.meta.env.VITE_TRANSPORT_INTEGRATION_URL;

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
  TRANSPORT_INTEGRATION_BASE_URL,
};

/**
 * Get full API URL for an endpoint
 * @param {string} endpoint - API endpoint path (with or without leading slash)
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Get headers with authentication token
 * @returns {HeadersInit} Headers object with token if available
 */
export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  return headers;
};

export default API_CONFIG;
