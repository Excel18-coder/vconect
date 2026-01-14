/**
 * Centralized Type Definitions
 */

// Base Types
export type ID = string | number;
export type Timestamp = string;
export type Currency = "KES"; // Kenyan Shilling

// User Related Types
export interface User {
  id: ID;
  email: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Profile {
  id: ID;
  userId: ID;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  userType: UserType | null;
  phoneNumber: string | null;
  location: string | null;
  rating?: number;
  reviewCount?: number;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type UserType = "buyer" | "seller" | "landlord";

// Product Related Types
export interface Product {
  id: ID;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: string;
  subcategory: string;
  condition: ProductCondition;
  location: string;
  images: ProductImage[];
  tags: string[];
  status: ProductStatus;
  views: number;
  favorites: number;
  sellerId: ID;
  seller?: SellerInfo;
  specifications?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductImage {
  id?: ID;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  order: number;
}

export type ProductCondition =
  | "new"
  | "like-new"
  | "excellent"
  | "good"
  | "fair"
  | "poor";
export type ProductStatus =
  | "active"
  | "sold"
  | "inactive"
  | "pending"
  | "rejected";

export interface SellerInfo {
  id: ID;
  displayName: string;
  email: string;
  location: string;
  phoneNumber?: string;
  avatarUrl?: string;
  rating?: number;
  responseTime?: string;
  verified: boolean;
}

// Filtering and Sorting
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  location?: string;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sellerId?: ID;
  status?: ProductStatus;
}

export interface ProductSort {
  field: "createdAt" | "price" | "views" | "title";
  order: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Message/Chat Types
export interface Message {
  id: ID;
  senderId: ID;
  recipientId: ID;
  productId?: ID;
  subject: string;
  content: string;
  read: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Conversation {
  id: ID;
  participantIds: ID[];
  participants: Profile[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Cart and Wishlist
export interface CartItem {
  id: ID;
  productId: ID;
  product: Product;
  quantity: number;
  addedAt: Timestamp;
}

export interface Cart {
  items: CartItem[];
  total: number;
  currency: Currency;
}

export interface WishlistItem {
  id: ID;
  productId: ID;
  product: Product;
  addedAt: Timestamp;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  userType: UserType;
  acceptTerms: boolean;
}

export interface ProductForm {
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  condition: ProductCondition;
  location: string;
  images: File[];
  tags: string[];
  specifications?: Record<string, any>;
}

export interface ProfileUpdateForm {
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  avatar?: File;
}

export interface MessageForm {
  recipientId: ID;
  productId?: ID;
  subject: string;
  content: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | ApiError;
  message?: string;
}

export type ViewMode = "grid" | "list";
export type Theme = "light" | "dark" | "system";

// Search Types
export interface SearchSuggestion {
  type: "product" | "category" | "location" | "user";
  label: string;
  value: string;
  metadata?: Record<string, any>;
}

export interface RecentSearch {
  query: string;
  timestamp: Timestamp;
}

// Notification Types
export interface Notification {
  id: ID;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: Timestamp;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: Timestamp;
}

// SEO Types
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type AsyncData<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export type AsyncFunction<T = void, P extends any[] = []> = (
  ...args: P
) => Promise<T>;
