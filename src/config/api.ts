/**
 * API Configuration
 * Handles API base URL for different environments
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     (import.meta.env.MODE === 'production' 
                       ? 'https://vconect.onrender.com/api'
                       : 'http://localhost:5000/api');

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
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
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export default API_CONFIG;
