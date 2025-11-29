import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl } from '../config/api';

interface BadgeCounts {
  newOffers: number;
  newMessages: number;
  pendingShipments: number;
}

export const useBadgeCounts = () => {
  const { user, token } = useAuth();
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    newOffers: 0,
    newMessages: 0,
    pendingShipments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      setBadgeCounts({ newOffers: 0, newMessages: 0, pendingShipments: 0 });
      setIsLoading(false);
      return;
    }

    const fetchBadgeCounts = async () => {
      try {
        setIsLoading(true);

        const authHeaders: HeadersInit = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const isDemoToken = token.startsWith('demo-token-');

        const fetchJson = async (endpoint: string) => {
          const response = await fetch(createApiUrl(endpoint), {
            headers: authHeaders,
          });

          if (!response.ok) {
            throw new Error(`${endpoint} yanıtı ${response.status}`);
          }

          return response.json();
        };

        const messagePromise = isDemoToken
          ? Promise.resolve({ data: [] })
          : fetchJson('/api/messages');

        const [offersResult, messagesResult, shipmentsResult] =
          await Promise.allSettled([
            fetchJson('/api/offers/individual'),
            messagePromise,
            fetchJson('/api/shipments'),
          ]);

        let newOffers = 0;
        if (offersResult.status === 'fulfilled') {
          const offersData = offersResult.value;
          const offers =
            offersData.data ||
            offersData.offers ||
            (Array.isArray(offersData) ? offersData : []);

          if (Array.isArray(offers)) {
            newOffers = offers.filter(
              offer =>
                (offer.status === 'pending' ||
                  offer.status === 'waiting' ||
                  offer.status === 'open') &&
                !offer.isRead
            ).length;

            // Fallback: if backend doesn't send isRead flags, count plain pending
            if (newOffers === 0) {
              newOffers = offers.filter(
                offer =>
                  offer.status === 'pending' ||
                  offer.status === 'waiting' ||
                  offer.status === 'open'
              ).length;
            }
          }
        }

        let newMessages = 0;
        if (messagesResult.status === 'fulfilled') {
          const conversations =
            messagesResult.value.data || messagesResult.value || [];

          if (Array.isArray(conversations)) {
            newMessages = conversations.reduce(
              (total, conversation) =>
                total + (conversation.unreadCount || conversation.unread || 0),
              0
            );
          }
        }

        let pendingShipments = 0;
        if (shipmentsResult.status === 'fulfilled') {
          const shipmentsData = shipmentsResult.value;
          const shipments =
            shipmentsData.data?.shipments ||
            shipmentsData.data ||
            (Array.isArray(shipmentsData) ? shipmentsData : []);

          if (Array.isArray(shipments)) {
            pendingShipments = shipments.filter(shipment => {
              const status = (shipment.status || '').toLowerCase();
              return (
                status === 'waiting' ||
                status === 'pending' ||
                status === 'open' ||
                status === 'preparing'
              );
            }).length;
          }
        }

        setBadgeCounts({
          newOffers,
          newMessages,
          pendingShipments,
        });
      } catch (error) {
        console.error('Error building badge counts:', error);
        setBadgeCounts({ newOffers: 0, newMessages: 0, pendingShipments: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadgeCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);

    return () => clearInterval(interval);
  }, [user, token]);

  return { badgeCounts, isLoading };
};

