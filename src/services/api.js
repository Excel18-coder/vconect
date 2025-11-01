// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Helper function to make authenticated requests
const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

// Authentication endpoints
export const authAPI = {
  // Register user
  register: async (email, password, displayName, userType = 'buyer') => {
    const response = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, userType }),
    });
    
    const data = await handleResponse(response);
    
    // Store tokens if registration includes them
    if (data.data?.tokens?.accessToken) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    }
    
    return data;
  },

  // Login user
  login: async (email, password) => {
    const response = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    const data = await handleResponse(response);
    
    // Store tokens
    if (data.data?.tokens?.accessToken) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    }
    
    return data;
  },

  // Logout user
  logout: async () => {
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
    
    // Clear tokens regardless
    clearAuth();
  },

  // Get current user
  getMe: async () => {
    const response = await authFetch('/auth/me');
    return handleResponse(response);
  },

  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await authFetch('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await handleResponse(response);
    
    // Update access token
    if (data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    
    return data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`);
    return handleResponse(response);
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await authFetch('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await authFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(response);
  },
};

// Legacy auth export for backwards compatibility
export const auth = authAPI;

// Profile API
export const profileAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await authFetch('/profile');
    return handleResponse(response);
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    
    return handleResponse(response);
  },

  // Update avatar URL
  updateAvatar: async (avatarUrl) => {
    const response = await authFetch('/profile/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    });
    
    return handleResponse(response);
  },

  // Get public profile
  getPublicProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
    return handleResponse(response);
  },

  // Search profiles
  searchProfiles: async (query, filters = {}) => {
    const params = new URLSearchParams({
      ...(query && { query }),
      ...filters,
    });
    
    const response = await fetch(`${API_BASE_URL}/profile/search?${params}`);
    return handleResponse(response);
  },
};

// Upload API
export const uploadAPI = {
  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    return handleResponse(response);
  },

  // Upload multiple listing images
  uploadListingImages: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload/listing-images`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    return handleResponse(response);
  },

  // Delete image
  deleteImage: async (publicId) => {
    const response = await authFetch(`/upload/image/${publicId}`, {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },

  // Get transformed image URL
  getTransformedImageUrl: async (publicId, options = {}) => {
    const params = new URLSearchParams(options);
    const response = await authFetch(`/upload/transform/${publicId}?${params}`);
    return handleResponse(response);
  },

  // Get upload signature for client-side uploads
  getUploadSignature: async (folder = 'vmarket') => {
    const response = await authFetch('/upload/signature', {
      method: 'POST',
      body: JSON.stringify({ folder }),
    });
    
    return handleResponse(response);
  },
};

// Messaging API
export const messageAPI = {
  // Send message to seller/user
  sendMessage: async (receiverId, subject, messageBody, attachmentUrl = null) => {
    const response = await authFetch('/buyers/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        subject,
        message_body: messageBody,
        attachment_url: attachmentUrl,
      }),
    });
    
    return handleResponse(response);
  },

  // Get user messages
  getMessages: async (conversationWith = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(conversationWith && { conversation_with: conversationWith }),
    });
    
    const response = await authFetch(`/buyers/messages?${params}`);
    return handleResponse(response);
  },

  // Get conversations list
  getConversations: async () => {
    const response = await authFetch('/buyers/messages/conversations');
    return handleResponse(response);
  },

  // Get single message
  getMessage: async (messageId) => {
    const response = await authFetch(`/buyers/messages/${messageId}`);
    return handleResponse(response);
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await authFetch(`/buyers/messages/${messageId}/read`, {
      method: 'PATCH',
    });
    
    return handleResponse(response);
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await authFetch(`/buyers/messages/${messageId}`, {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },

  // Reply to message
  replyToMessage: async (messageId, messageBody, attachmentUrl = null) => {
    const response = await authFetch(`/buyers/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({
        message_body: messageBody,
        attachment_url: attachmentUrl,
      }),
    });
    
    return handleResponse(response);
  },
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

// Utility function to clear authentication
export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
