import { useState, useEffect, useRef, useCallback } from 'react';
import { createApiUrl } from '../config/api';
import { normalizeTrackingCode } from '../utils/trackingCode';
import { useAuth } from '../contexts/AuthContext';

interface Shipment {
  id: string;
  tracking_code?: string;
  title: string;
  description?: string;
  from: string;
  to: string;
  pickup_address?: string;
  delivery_address?: string;
  status: 'preparing' | 'waiting' | 'waiting_for_offers' | 'offer_accepted' | 'accepted' | 'in_progress' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent';
  created_at: string;
  updated_at: string;
  pickup_date: string;
  delivery_date?: string;
  price: number;
  cargo_value?: number;
  payment_method?: 'cash' | 'transfer';
  weight?: number;
  volume?: number;
  dimensions?: string;
  package_type?: string;
  category?: string;
  sub_category?: string;
  sender_name?: string;
  sender_phone?: string;
  sender_address?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  recipient_id?: string;
  carrier_id?: string;
  carrier_name?: string;
  carrier_company?: string;
  carrier_email?: string;
  carrier_phone?: string;
  carrier_type?: string;
  carrier_rating?: number;
  carrier_reviews?: number;
  carrier_verified?: boolean;
  completed_jobs?: number;
  success_rate?: number;
  driver_name?: string;
  driver_id?: string;
  driver_phone?: string;
  driver_email?: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  tracking_number?: string;
  rating?: number;
  special_requests?: string;
  user_rated?: boolean;
  carrier_rated?: boolean;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const useMyShipments = (basePath: string) => {
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
  const errorShownRef = useRef(false);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    const t = setTimeout(() => setNotification(null), 1800);
    return () => clearTimeout(t);
  }, []);

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setShipments([]);
        setLoading(false);
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
        if (response.status !== 401 && response.status !== 403) {
          throw new Error(`HTTP ${response.status}`);
        } else {
          setShipments([]);
          setLoading(false);
          return;
        }
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
      
      errorShownRef.current = false;
      setNotification(null);
    } catch (error) {
      console.error('Error loading shipments:', error);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        showNotification('error', 'Gönderiler yüklenirken bir hata oluştu');
      }
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, searchTerm, statusFilter, sortBy, isCorporateView, showNotification]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleSort = useCallback((sort: string) => {
    setSortBy(sort);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const refreshShipments = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    loadShipments();
  }, [loadShipments]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  return {
    shipments,
    loading,
    pagination,
    notification,
    isCorporateView,
    searchTerm,
    statusFilter,
    sortBy,
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    refreshShipments,
    showNotification,
    toTrackingCode,
    setShipments,
    setNotification,
  };
};

export type { Shipment, PaginationState, Notification };
