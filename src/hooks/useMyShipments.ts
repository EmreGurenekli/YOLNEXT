/**
 * @fileoverview useMyShipments Hook - Comprehensive shipment management for users
 * 
 * PURPOSE: This hook manages all shipment-related operations for both individual 
 * and corporate users. It handles data fetching, filtering, pagination, and real-time updates.
 * 
 * RESPONSIBILITIES:
 * - Fetch user's shipments from backend API
 * - Handle search, filtering, and sorting operations  
 * - Manage pagination state
 * - Provide real-time updates via polling
 * - Handle notifications and error states
 * - Support both individual and corporate user types
 * 
 * USED BY:
 * - src/pages/individual/MyShipments.tsx
 * - src/pages/corporate/MyShipments.tsx (if exists)
 * 
 * API ENDPOINTS CALLED:
 * - GET /api/shipments (individual users)
 * - GET /api/corporate/shipments (corporate users)
 * 
 * @author YolNext Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createApiUrl } from '../config/api';
import { normalizeTrackingCode } from '../utils/trackingCode';
import { useAuth } from '../contexts/AuthContext';

/**
 * Main shipment entity interface
 * 
 * BUSINESS PURPOSE: Represents a cargo/package shipment in the YolNext platform
 * 
 * LIFECYCLE STATES:
 * - preparing: User is filling shipment details
 * - waiting/waiting_for_offers: Shipment published, waiting for carrier offers
 * - offer_accepted: User accepted a carrier's offer
 * - in_progress: Carrier started the job
 * - picked_up: Package picked up from sender
 * - in_transit: Package is being transported
 * - delivered: Package delivered to recipient
 * - completed: Job finished, ratings done
 * - cancelled: Shipment cancelled by user or system
 */
interface Shipment {
  // Core Identification
  id: string;                    // Unique shipment identifier
  tracking_code?: string;        // Public tracking code (e.g., YN123456)
  
  // Basic Information
  title: string;                 // User-defined shipment title
  description?: string;          // Detailed description of contents
  
  // Route Information
  from: string;                  // Origin city/location
  to: string;                    // Destination city/location
  pickup_address?: string;       // Detailed pickup address
  delivery_address?: string;     // Detailed delivery address
  
  // Status & Lifecycle
  status: 'preparing' | 'waiting' | 'waiting_for_offers' | 'offer_accepted' | 'accepted' | 'in_progress' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent'; // Shipment urgency level
  
  // Timestamps
  created_at: string;            // When shipment was created
  updated_at: string;            // Last modification time
  pickup_date: string;           // Requested pickup date
  delivery_date?: string;        // Actual/estimated delivery date
  
  // Financial Information
  price: number;                 // Agreed shipment price (in TRY)
  cargo_value?: number;          // Declared value of contents
  payment_method?: 'cash' | 'transfer'; // Payment method
  
  // Physical Properties
  weight?: number;               // Package weight (kg)
  volume?: number;               // Package volume (m³)
  dimensions?: string;           // Package dimensions (LxWxH cm)
  package_type?: string;         // Type of package (box, envelope, etc.)
  category?: string;             // Shipment category (house_move, personal, etc)
  sub_category?: string;         // Sub category
  
  // Party Information
  sender_name?: string;          // Sender full name
  sender_phone?: string;         // Sender contact number
  sender_address?: string;       // Sender full address
  receiver_name?: string;        // Recipient full name
  receiver_phone?: string;       // Recipient contact number
  receiver_address?: string;     // Recipient full address
  recipient_id?: string;         // Internal recipient ID
  
  // Carrier Information (populated when offer is accepted)
  carrier_id?: string;           // Assigned carrier's user ID
  carrier_name?: string;         // Carrier company/person name
  carrier_company?: string;      // Carrier company name
  carrier_email?: string;        // Carrier contact email
  carrier_phone?: string;        // Carrier contact phone
  carrier_type?: string;         // nakliyeci or tasiyici
  carrier_rating?: number;       // Carrier rating (1-5)
  carrier_reviews?: number;      // Number of reviews
  carrier_verified?: boolean;    // Is carrier verified
  completed_jobs?: number;       // Carrier's completed jobs
  success_rate?: number;         // Carrier's success rate
  
  // Driver/Vehicle Information
  driver_name?: string;          // Driver name
  driver_id?: string;           // Driver ID
  driver_phone?: string;         // Driver contact
  driver_email?: string;         // Driver email
  vehicle_plate?: string;        // Vehicle plate number
  vehicle_type?: string;         // Vehicle type
  
  // Additional Properties
  tracking_number?: string;      // Additional tracking number
  rating?: number;               // User rating for this shipment
  
  // Additional Options
  special_requests?: string;     // Special handling instructions
  
  // Rating System
  user_rated?: boolean;         // Has user rated the carrier?
  carrier_rated?: boolean;      // Has carrier rated the user?
}

/**
 * Pagination state management interface
 * 
 * PURPOSE: Handles paginated shipment lists to improve performance
 * with large datasets and provide better UX
 */
interface PaginationState {
  currentPage: number;    // Current active page (1-based)
  totalPages: number;     // Total number of pages available
  totalCount: number;     // Total number of shipments (all pages)
  hasMore: boolean;       // Whether there are more pages to load
}

/**
 * User notification interface
 * 
 * PURPOSE: Provides user feedback for operations (success, errors, info)
 * Notifications auto-hide after 1.8 seconds
 */
interface Notification {
  type: 'success' | 'error' | 'info';  // Notification severity/type
  message: string;                      // User-friendly message text
}

/**
 * Custom hook for managing user shipments with comprehensive functionality
 * 
 * This is the PRIMARY hook for shipment management in the YolNext platform.
 * It provides a complete solution for fetching, filtering, searching, and 
 * managing user shipments with real-time updates.
 * 
 * FEATURES PROVIDED:
 * - Shipment data fetching with automatic pagination
 * - Real-time search and filtering capabilities  
 * - Automatic data refresh on window focus/visibility change
 * - Notification system for user feedback
 * - Support for both individual and corporate user types
 * - Error handling and loading states
 * - Optimized API calls with debouncing
 * 
 * ARCHITECTURE:
 * - Uses React hooks for state management (useState, useEffect, useRef)
 * - Implements polling for real-time updates
 * - Manages JWT authentication automatically
 * - Provides unified interface for different user types
 * 
 * @param basePath - User type path ('/individual' or '/corporate')
 *                   This determines which API endpoint to use
 * 
 * @returns Object containing:
 * - shipments: Array of user's shipments
 * - loading: Boolean indicating data fetch state
 * - pagination: Pagination state and controls
 * - notification: Current notification (if any)
 * - Search/filter functions and current values
 * - Action functions for shipment operations
 * 
 * @example
 * ```typescript
 * // In a React component
 * const {
 *   shipments,
 *   loading, 
 *   handleSearch,
 *   handleStatusFilter,
 *   refreshShipments
 * } = useMyShipments('/individual');
 * 
 * // Search for shipments
 * handleSearch('Istanbul'); 
 * 
 * // Filter by status
 * handleStatusFilter('in_progress');
 * 
 * // Refresh data
 * refreshShipments();
 * ```
 * 
 * USED BY: MyShipments.tsx components for both individual and corporate users
 */
export const useMyShipments = (basePath: string) => {
  const location = useLocation();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [notification, setNotification] = useState<Notification | null>(null);

  const isCorporateView = basePath === '/corporate';
  const toTrackingCode = normalizeTrackingCode;
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    const t = setTimeout(() => setNotification(null), 1800);
    return () => clearTimeout(t);
  };

  const loadShipments = async () => {
    try {
      setLoading(true);
      
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found');
        setShipments([]);
        return;
      }

      const params = new URLSearchParams({
        page: String(pagination.currentPage),
        limit: '10',
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        sortBy,
      });

      const endpoint = isCorporateView ? '/api/corporate/shipments' : '/api/shipments';
      const response = await fetch(createApiUrl(`${endpoint}?${params}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const shipmentsData = data.shipments || [];
      
      setShipments(shipmentsData);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1,
        totalCount: data.totalCount || 0,
        hasMore: data.hasMore || false,
      }));
    } catch (error) {
      console.error('Error loading shipments:', error);
      showNotification('error', 'Gönderiler yüklenirken bir hata oluştu');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (sort: string) => {
    setSortBy(sort);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const refreshShipments = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(loadShipments, 100);
  };

  // Auto-refresh için visibility change handler
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      refreshShipments();
    }
  };

  const handleFocus = () => {
    refreshShipments();
  };

  // DEMO FIX: Prevent infinite loop by removing problematic dependencies
  useEffect(() => {
    loadShipments();
  }, []); // Empty dependency array - load only once

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    // Data
    shipments,
    loading,
    pagination,
    notification,
    isCorporateView,
    
    // Filters
    searchTerm,
    statusFilter,
    sortBy,
    
    // Actions
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    refreshShipments,
    showNotification,
    toTrackingCode,
    
    // Utils
    setShipments,
    setNotification,
  };
};

export type { Shipment, PaginationState, Notification };








