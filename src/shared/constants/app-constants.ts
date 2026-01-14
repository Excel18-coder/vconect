/**
 * Application Constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES: 10,
} as const;

// Product Categories
export const CATEGORIES = {
  HOUSE: {
    value: 'house',
    label: 'Real Estate',
    icon: '🏠',
    subcategories: ['Apartments', 'Houses', 'Land', 'Commercial'],
  },
  TRANSPORT: {
    value: 'transport',
    label: 'Transportation',
    icon: '🚗',
    subcategories: ['Cars', 'Motorcycles', 'Bicycles', 'Parts & Accessories'],
  },
  MARKET: {
    value: 'market',
    label: 'Marketplace',
    icon: '🛍️',
    subcategories: ['Electronics', 'Clothing', 'Home & Garden', 'Sports'],
  },
  ENTERTAINMENT: {
    value: 'entertainment',
    label: 'Entertainment',
    icon: '🎭',
    subcategories: ['Events', 'Music', 'Movies', 'Games'],
  },
} as const;

// Kenya Locations
export const KENYA_LOCATIONS = [
  { value: 'nairobi', label: 'Nairobi' },
  { value: 'mombasa', label: 'Mombasa' },
  { value: 'kisumu', label: 'Kisumu' },
  { value: 'nakuru', label: 'Nakuru' },
  { value: 'eldoret', label: 'Eldoret' },
  { value: 'thika', label: 'Thika' },
  { value: 'malindi', label: 'Malindi' },
  { value: 'kitale', label: 'Kitale' },
  { value: 'garissa', label: 'Garissa' },
  { value: 'kakamega', label: 'Kakamega' },
] as const;

// Product Conditions
export const PRODUCT_CONDITIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

// User Types
export const USER_TYPES = [
  { value: 'buyer', label: 'Buyer', description: 'Browse and purchase products' },
  { value: 'seller', label: 'Seller', description: 'List and sell products' },
  { value: 'landlord', label: 'Landlord', description: 'List properties for rent/sale' },
] as const;

// Sort Options
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'most-viewed', label: 'Most Viewed' },
] as const;

// Form Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+254|0)[17]\d{8}$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 5000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'vconect_token',
  REFRESH_TOKEN: 'vconect_refresh_token',
  USER_PREFERENCES: 'vconect_preferences',
  CART: 'vconect_cart',
  RECENT_SEARCHES: 'vconect_recent_searches',
  THEME: 'vconect_theme',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTER_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PRODUCT_CREATED: 'Product listed successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
  PRODUCT_DELETED: 'Product deleted successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  ACCOUNT: '/account',
  PRODUCT_DETAIL: '/product/:id',
  POST_AD: '/post-ad',
  SELL: '/sell',
  SEARCH: '/search',
  CATEGORY: '/category/:category',
  NOT_FOUND: '*',
} as const;

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  ENABLE_WISHLIST: true,
  ENABLE_CART: true,
  ENABLE_REVIEWS: false,
  ENABLE_CHAT: true,
  ENABLE_VIDEO_UPLOAD: false,
  ENABLE_SOCIAL_LOGIN: false,
  ENABLE_PWA: true,
} as const;

// Performance
export const PERFORMANCE = {
  IMAGE_LOADING: 'lazy' as const,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 1 * 60 * 1000, // 1 minute
} as const;

export default {
  API_CONFIG,
  PAGINATION,
  FILE_UPLOAD,
  CATEGORIES,
  KENYA_LOCATIONS,
  PRODUCT_CONDITIONS,
  USER_TYPES,
  SORT_OPTIONS,
  VALIDATION,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  FEATURE_FLAGS,
  PERFORMANCE,
};
