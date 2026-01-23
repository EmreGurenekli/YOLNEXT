import { io, Socket } from 'socket.io-client';
import { createApiUrl } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000; // 30 seconds max delay
  private reconnectDelayMultiplier = 2;

  private shouldDebugLog(): boolean {
    try {
      // Prefer local override; fallback to Vite env
      const v = localStorage.getItem('debugSocket');
      if (v === '1' || v === 'true') return true;
    } catch (_) {
      // ignore
    }

    try {
      // Vite
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mode = (import.meta as any)?.env?.MODE;
      return mode !== 'production';
    } catch (_) {
      return true;
    }
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socketUrl = createApiUrl('/');

        this.socket = io(socketUrl, {
          auth: {
            token: token || localStorage.getItem('authToken'),
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('Socket bağlandı:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', error => {
          // WebSocket bağlantısı başarısız olsa bile devam et (demo mod için)
          console.log(
            'Socket bağlantı hatası (demo modda yok sayıldı):',
            error.message
          );
          resolve(); // Promise'i resolve et, hatayı devam ettirme
        });

        this.socket.on('disconnect', reason => {
          console.log('Socket bağlantısı kesildi:', reason);
        });

        this.socket.on('reconnect', attemptNumber => {
          console.log('Socket yeniden bağlandı:', attemptNumber, 'deneme');
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_error', error => {
          console.error('Socket yeniden bağlanma hatası:', error);
          this.reconnectAttempts++;
          
          // Exponential backoff: increase delay with each attempt
          const newDelay = Math.min(
            this.reconnectDelay * Math.pow(this.reconnectDelayMultiplier, this.reconnectAttempts),
            this.maxReconnectDelay
          );
          
          // Update socket.io reconnection delay
          if (this.socket) {
            this.socket.io.reconnectionDelay(newDelay);
          }
        });

        this.socket.on('reconnect_failed', () => {
          console.error(
            'Socket yeniden bağlanma başarısız (deneme sayısı):',
            this.maxReconnectAttempts,
            'deneme'
          );
        });
      } catch (error) {
        console.error('Socket başlatma hatası:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      // Reduce console noise in demo/unstable WS environments.
      // These events are best-effort and safe to ignore when not connected.
      const silentEvents = new Set([
        'join_shipment_room',
        'leave_shipment_room',
        'join_message_room',
        'leave_message_room',
        'subscribe_notifications',
        'unsubscribe_notifications',
        'subscribe_offers',
        'unsubscribe_offers',
        'update_location',
      ]);

      if (!silentEvents.has(event) && this.shouldDebugLog()) {
        console.warn('Socket not connected. Cannot emit event:', event);
      } else if (this.shouldDebugLog()) {
        console.debug('Socket not connected. Event ignored:', event);
      }
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Shipment tracking events
  joinShipmentRoom(shipmentId: string): void {
    this.emit('join_shipment_room', { shipmentId });
  }

  leaveShipmentRoom(shipmentId: string): void {
    this.emit('leave_shipment_room', { shipmentId });
  }

  // Message events
  sendMessage(roomId: string, message: string, type: string = 'text'): void {
    this.emit('send_message', {
      roomId,
      message,
      type,
    });
  }

  joinMessageRoom(roomId: string): void {
    this.emit('join_message_room', { roomId });
  }

  leaveMessageRoom(roomId: string): void {
    this.emit('leave_message_room', { roomId });
  }

  // Notification events
  subscribeToNotifications(): void {
    this.emit('subscribe_notifications');
  }

  unsubscribeFromNotifications(): void {
    this.emit('unsubscribe_notifications');
  }

  // Offer events
  subscribeToOffers(): void {
    this.emit('subscribe_offers');
  }

  unsubscribeFromOffers(): void {
    this.emit('unsubscribe_offers');
  }

  // Real-time tracking
  updateLocation(
    shipmentId: string,
    location: { lat: number; lng: number }
  ): void {
    this.emit('update_location', {
      shipmentId,
      location,
    });
  }

  // Event listeners for common events
  onNewMessage(callback: (data: any) => void): void {
    this.on('new_message', callback);
    this.on('message_received', callback);
  }

  onNewOffer(callback: (data: any) => void): void {
    this.on('new_offer', callback);
    // Backend often emits status change rather than a distinct "new_offer"
    this.on('offer_status_changed', callback);
  }

  onOfferAccepted(callback: (data: any) => void): void {
    this.on('offer_accepted', callback);
  }

  onOfferRejected(callback: (data: any) => void): void {
    this.on('offer_rejected', callback);
  }

  onShipmentUpdate(callback: (data: any) => void): void {
    this.on('shipment_update', callback);
    // Backend emits this event name
    this.on('shipment_status_changed', callback);
  }

  onTrackingUpdate(callback: (data: any) => void): void {
    this.on('tracking_update', callback);
  }

  onNotification(callback: (data: any) => void): void {
    this.on('notification', callback);
  }

  onError(callback: (error: any) => void): void {
    this.on('error', callback);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
