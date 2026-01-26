import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createApiUrl } from '../config/api';
import { normalizeTrackingCode } from '../utils/trackingCode';
import { getStatusText as getShipmentStatusText } from '../utils/shipmentStatus';

interface TrackingEvent {
  id: string;
  location: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
}

interface Shipment {
  id: string;
  trackingNumber: string;
  trackingCode?: string;
  title: string;
  status: 'pending' | 'waiting_for_offers' | 'preparing' | 'offer_accepted' | 'in_transit' | 'accepted' | 'in_progress' | 'assigned' | 'picked_up' | 'delivered' | 'completed';
  currentLocation: string;
  estimatedDelivery: string;
  carrier: {
    name: string;
    phone?: string;
    email?: string;
    rating?: number;
    completedJobs?: number;
  };
  route: {
    from: string;
    to: string;
    distance: string;
    duration: string;
  };
  events: TrackingEvent[];
  price?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const useLiveTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('tracking') || '');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchTime = useRef<number>(0);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const trackShipment = async (trackingCode?: string) => {
    const codeToTrack = trackingCode || trackingNumber;
    if (!codeToTrack.trim()) {
      setError('Lütfen takip numarası girin');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const normalizedCode = normalizeTrackingCode(codeToTrack);
      const token = localStorage.getItem('authToken');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(createApiUrl(`/api/shipments/track/${encodeURIComponent(normalizedCode)}`), {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const shipmentData = data.shipment || data;
      
      setShipment(shipmentData);
      setError(null);
      lastFetchTime.current = Date.now();
      
      if (!searchParams.get('tracking')) {
        setSearchParams({ tracking: normalizedCode });
      }
      
      showNotification('success', 'Gönderi başarıyla bulundu');
      
      if (shipmentData.status === 'in_transit' || shipmentData.status === 'picked_up' || shipmentData.status === 'in_progress') {
        startPolling();
      }
      
    } catch (error) {
      console.error('Tracking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gönderi bulunamadı';
      setError(errorMessage);
      setShipment(null);
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    
    setIsPolling(true);
    pollingRef.current = setInterval(async () => {
      if (!shipment) return;
      
      try {
        const token = localStorage.getItem('authToken');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(createApiUrl(`/api/shipments/track/${encodeURIComponent(shipment.trackingCode || shipment.trackingNumber)}`), {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          const updatedShipment = data.shipment || data;
          
          if (updatedShipment.events && updatedShipment.events.length > (shipment.events?.length || 0)) {
            showNotification('info', 'Gönderi durumu güncellendi');
          }
          
          setShipment(updatedShipment);
          lastFetchTime.current = Date.now();
          
          if (updatedShipment.status === 'completed' || updatedShipment.status === 'delivered') {
            stopPolling();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  const refreshTracking = () => {
    if (shipment) {
      trackShipment(shipment.trackingCode || shipment.trackingNumber);
    } else if (trackingNumber) {
      trackShipment(trackingNumber);
    }
  };

  const handleTrackingNumberChange = (value: string) => {
    setTrackingNumber(value);
    setError(null);
  };

  const getStatusInfo = (status: string) => {
    const labelOrRaw = (s: string) => {
      const v = String(s || '');
      const mapped = getShipmentStatusText(v);
      return mapped === 'Bilinmiyor' ? v : mapped;
    };
    switch (status) {
      case 'pending':
      case 'waiting_for_offers':
        return {
          label: labelOrRaw(status === 'pending' ? 'waiting_for_offers' : status),
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'preparing':
      case 'offer_accepted':
      case 'accepted':
        return {
          label: status === 'preparing' ? 'Hazırlanıyor' : labelOrRaw(status),
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'in_progress':
      case 'assigned':
      case 'picked_up':
        return {
          label: labelOrRaw(status),
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
        };
      case 'in_transit':
        return {
          label: labelOrRaw(status),
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        };
      case 'delivered':
      case 'completed':
        return {
          label: labelOrRaw(status),
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      default:
        return {
          label: labelOrRaw(status),
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  useEffect(() => {
    const urlTrackingNumber = searchParams.get('tracking');
    if (urlTrackingNumber && !shipment) {
      setTrackingNumber(urlTrackingNumber);
      trackShipment(urlTrackingNumber);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (shipment && (shipment.status === 'in_transit' || shipment.status === 'picked_up' || shipment.status === 'in_progress')) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shipment]);

  return {
    trackingNumber,
    shipment,
    loading,
    error,
    notification,
    isPolling,
    trackShipment,
    refreshTracking,
    handleTrackingNumberChange,
    showNotification,
    getStatusInfo,
    lastFetchTime: lastFetchTime.current,
  };
};

export type { Shipment, TrackingEvent, Notification };
