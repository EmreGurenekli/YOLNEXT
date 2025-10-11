import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(token?: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    
    this.socket = io(url, {
      auth: {
        token: token || localStorage.getItem('authToken')
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.setupEventListeners()
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      this.reconnectAttempts = 0
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed')
    })
  }

  // Message events
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback)
  }

  onMessageUpdate(callback: (message: any) => void) {
    this.socket?.on('message_update', callback)
  }

  onMessageDelete(callback: (messageId: string) => void) {
    this.socket?.on('message_delete', callback)
  }

  // Shipment events
  onShipmentUpdate(callback: (shipment: any) => void) {
    this.socket?.on('shipment_update', callback)
  }

  onShipmentStatusChange(callback: (data: { shipmentId: string; status: string }) => void) {
    this.socket?.on('shipment_status_change', callback)
  }

  // Notification events
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback)
  }

  onSystemNotification(callback: (notification: any) => void) {
    this.socket?.on('system_notification', callback)
  }

  // User events
  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on('user_online', callback)
  }

  onUserOffline(callback: (userId: string) => void) {
    this.socket?.on('user_offline', callback)
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('user_typing', callback)
  }

  // Emit events
  joinRoom(roomId: string) {
    this.socket?.emit('join_room', roomId)
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', roomId)
  }

  sendMessage(data: {
    roomId: string
    content: string
    type?: 'text' | 'image' | 'file'
    metadata?: any
  }) {
    this.socket?.emit('send_message', data)
  }

  updateShipmentStatus(shipmentId: string, status: string, metadata?: any) {
    this.socket?.emit('update_shipment_status', {
      shipmentId,
      status,
      metadata
    })
  }

  sendTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, isTyping })
  }

  // Generic event handling
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback)
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback)
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data)
  }

  // Connection status
  get isConnected() {
    return this.socket?.connected || false
  }

  get id() {
    return this.socket?.id
  }
}

export const socketService = new SocketService()


