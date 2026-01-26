import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl } from '../config/api';

interface UseNotificationsReturn {
  unreadCount: number;
  refreshCount: () => void;
  isLoading: boolean;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user || !token) {
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(createApiUrl('/api/notifications/unread-count'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.unreadCount || data.data?.count || 0);
      }
    } catch (error) {
      console.error('Unread notification count fetch error:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener('yolnext:refresh-notifications', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('yolnext:refresh-notifications', handleRefresh);
    };
  }, [user, token]);

  return {
    unreadCount,
    refreshCount: fetchUnreadCount,
    isLoading,
  };
};
