import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl } from '../config/api';

interface BadgeCounts {
  newOffers: number;
  newMessages: number;
  pendingShipments: number;
}

const offersLastSeenKey = (userId: string | number | null | undefined, role: string) =>
  `yolnext:lastSeen:offers:${userId ?? 'anon'}:${role || 'unknown'}`;

const marketLastSeenKey = (userId: string | number | null | undefined, role: string) =>
  `yolnext:lastSeen:market:${userId ?? 'anon'}:${role || 'unknown'}`;

export const useNotificationBadgeCounts = () => {
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

    let inFlight: Promise<void> | null = null;
    let nextAllowedAt = 0;
    let consecutiveFailures = 0;

    const fetchBadgeCounts = async () => {
      if (inFlight) return inFlight;

      const now = Date.now();
      if (now < nextAllowedAt) {
        return;
      }

      inFlight = (async () => {
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

            if (response.status === 401 || response.status === 403) {
              try {
                const text = await response.text();
                const lower = String(text || '').toLowerCase();
                if (lower.includes('invalid or expired token') || lower.includes('invalid token') || lower.includes('expired token')) {
                  try {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                  } catch (_) {
                    // ignore
                  }
                  window.dispatchEvent(new Event('auth:logout'));
                }
              } catch (_) {
                // ignore
              }
              throw new Error(`${endpoint} yanıtı ${response.status}`);
            }

            if (!response.ok) {
              throw new Error(`${endpoint} yanıtı ${response.status}`);
            }

            return response.json();
          };

          const messagePromise = isDemoToken
            ? Promise.resolve({ data: [] })
            : fetchJson('/messages');

          const role = String(user.role || '').toLowerCase();
          const offersEndpoint =
            role === 'nakliyeci' || role === 'tasiyici'
              ? '/offers'
              : role === 'corporate'
                ? '/offers/corporate'
                : '/offers/individual';

          const getPendingMarketCount = async (): Promise<number> => {
            const role = String(user.role || '').toLowerCase();
            const lastSeenKey = marketLastSeenKey(user?.id, role);
            const lastSeenRaw = localStorage.getItem(lastSeenKey);
            const lastSeenMs = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;

            const countNewerThan = (rows: any[]) => {
              if (!Array.isArray(rows)) return 0;
              if (!Number.isFinite(lastSeenMs) || lastSeenMs <= 0) return rows.length;
              return rows.filter(r => {
                const createdAt = r?.createdAt || r?.created_at || r?.createdat || r?.created_at;
                const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
                if (!Number.isFinite(createdMs) || createdMs <= 0) return false;
                return createdMs > lastSeenMs;
              }).length;
            };

            if (role === 'nakliyeci') {
              const openShipments = await fetchJson('/shipments/open');
              const rows =
                openShipments?.data?.data ||
                openShipments?.data ||
                openShipments?.shipments ||
                openShipments?.data?.shipments ||
                [];
              return countNewerThan(Array.isArray(rows) ? rows : []);
            }

            if (role === 'tasiyici') {
              try {
                const listings = await fetchJson('/carrier-market/available');
                const rows = listings?.data || (Array.isArray(listings) ? listings : []);
                return countNewerThan(Array.isArray(rows) ? rows : []);
              } catch {
                const openShipments = await fetchJson('/shipments/open');
                const rows =
                  openShipments?.data?.data ||
                  openShipments?.data ||
                  openShipments?.shipments ||
                  openShipments?.data?.shipments ||
                  [];
                return countNewerThan(Array.isArray(rows) ? rows : []);
              }
            }

            return 0;
          };

          const [offersResult, messagesResult, shipmentsResult] =
            await Promise.allSettled([
              fetchJson(offersEndpoint),
              messagePromise,
              fetchJson('/shipments'),
            ]);

          let newOffers = 0;
          if (offersResult.status === 'fulfilled') {
            const offersData = offersResult.value;
            const offers =
              offersData.data ||
              offersData.offers ||
              (Array.isArray(offersData) ? offersData : []);

            if (Array.isArray(offers)) {
              const lastSeenKey = offersLastSeenKey(user?.id, role);
              const lastSeenRaw = localStorage.getItem(lastSeenKey);
              const lastSeenMs = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;
              newOffers = offers.filter(
                offer =>
                  (offer.status === 'pending' ||
                    offer.status === 'waiting' ||
                    offer.status === 'open') &&
                  offer.isRead === false
              ).length;

              if (newOffers === 0) {
                newOffers = offers.filter(
                  offer => {
                    const status = offer.status;
                    if (!(status === 'pending' || status === 'waiting' || status === 'open')) return false;
                    const createdAt = offer.createdAt || offer.created_at || offer.createdat || offer.created_at;
                    const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
                    if (!Number.isFinite(lastSeenMs) || lastSeenMs <= 0) return true;
                    if (!Number.isFinite(createdMs) || createdMs <= 0) return false;
                    return createdMs > lastSeenMs;
                  }
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
          if (role === 'nakliyeci' || role === 'tasiyici') {
            pendingShipments = await getPendingMarketCount();
          } else if (shipmentsResult.status === 'fulfilled') {
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

          consecutiveFailures = 0;
          nextAllowedAt = 0;
        } catch (error) {
          consecutiveFailures += 1;
          const backoffMs = Math.min(60000, 5000 * Math.pow(2, Math.max(0, consecutiveFailures - 1)));
          nextAllowedAt = Date.now() + backoffMs;

          if (import.meta.env.DEV && error instanceof Error && error.message.includes('500')) {
            console.error('Rozet sayıları oluşturulurken kritik hata:', error);
          }
          setBadgeCounts({ newOffers: 0, newMessages: 0, pendingShipments: 0 });
        } finally {
          setIsLoading(false);
          inFlight = null;
        }
      })();

      return inFlight;
    };

    fetchBadgeCounts();

    const interval = setInterval(fetchBadgeCounts, 30000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchBadgeCounts();
      }
    };

    const handleSocketRefresh = () => {
      fetchBadgeCounts();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('yolnext:refresh-badges', handleSocketRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('yolnext:refresh-badges', handleSocketRefresh);
    };
  }, [user, token]);

  return { badgeCounts, isLoading };
};
