import { io } from 'socket.io-client';
class SocketService {
    constructor() {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "reconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "maxReconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(this, "reconnectDelay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
    }
    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }
        const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        this.socket = io(url, {
            auth: {
                token: token || localStorage.getItem('authToken')
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
        });
        this.setupEventListeners();
        return this.socket;
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
    setupEventListeners() {
        if (!this.socket)
            return;
        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.reconnectAttempts = 0;
        });
        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
        });
        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
        });
        this.socket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });
        this.socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed');
        });
    }
    // Message events
    onNewMessage(callback) {
        this.socket?.on('new_message', callback);
    }
    onMessageUpdate(callback) {
        this.socket?.on('message_update', callback);
    }
    onMessageDelete(callback) {
        this.socket?.on('message_delete', callback);
    }
    // Shipment events
    onShipmentUpdate(callback) {
        this.socket?.on('shipment_update', callback);
    }
    onShipmentStatusChange(callback) {
        this.socket?.on('shipment_status_change', callback);
    }
    // Notification events
    onNotification(callback) {
        this.socket?.on('notification', callback);
    }
    onSystemNotification(callback) {
        this.socket?.on('system_notification', callback);
    }
    // User events
    onUserOnline(callback) {
        this.socket?.on('user_online', callback);
    }
    onUserOffline(callback) {
        this.socket?.on('user_offline', callback);
    }
    onUserTyping(callback) {
        this.socket?.on('user_typing', callback);
    }
    // Emit events
    joinRoom(roomId) {
        this.socket?.emit('join_room', roomId);
    }
    leaveRoom(roomId) {
        this.socket?.emit('leave_room', roomId);
    }
    sendMessage(data) {
        this.socket?.emit('send_message', data);
    }
    updateShipmentStatus(shipmentId, status, metadata) {
        this.socket?.emit('update_shipment_status', {
            shipmentId,
            status,
            metadata
        });
    }
    sendTyping(roomId, isTyping) {
        this.socket?.emit('typing', { roomId, isTyping });
    }
    // Generic event handling
    on(event, callback) {
        this.socket?.on(event, callback);
    }
    off(event, callback) {
        this.socket?.off(event, callback);
    }
    emit(event, data) {
        this.socket?.emit(event, data);
    }
    // Connection status
    get isConnected() {
        return this.socket?.connected || false;
    }
    get id() {
        return this.socket?.id;
    }
}
export const socketService = new SocketService();
