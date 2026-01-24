// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// User Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  phone?: string;
  address?: string;
  companyName?: string;
  taxNumber?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shipment Types
export interface Shipment {
  id: string;
  title: string;
  description: string;
  pickup_address: string;
  delivery_address: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  price: number;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Offer Types
export interface Offer {
  id: string;
  shipment_id: string;
  nakliyeci_id: string;
  price: number;
  message?: string;
  estimated_delivery?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Form Types
export interface CreateShipmentForm {
  mainCategory: string;
  productDescription: string;
  weight: string;
  quantity: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  deliveryDate: string;
  price: string;
  contactPerson: string;
  phone: string;
  email: string;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface ShipmentFilters {
  status?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  pickupCity?: string;
  deliveryCity?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Search Types
export interface SearchParams {
  query?: string;
  filters?: ShipmentFilters;
  pagination?: PaginationParams;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalShipments: number;
  activeOffers: number;
  completedDeliveries: number;
  totalEarnings: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type:
    | 'shipment_created'
    | 'offer_received'
    | 'offer_accepted'
    | 'delivery_completed';
  message: string;
  timestamp: string;
  data?: any;
}

// Settings Types
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
    showAddress: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
  };
}

// Types are already exported above









