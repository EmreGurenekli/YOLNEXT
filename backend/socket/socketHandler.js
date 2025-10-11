const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> userId mapping
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // JWT authentication middleware for socket connections
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.userId;
        socket.userType = decoded.panel_type;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ User ${socket.userId} connected via socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, socket.userId);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Join user to their panel type room
      socket.join(`panel_${socket.userType}`);

      // Handle new shipment created
      socket.on('shipment_created', (data) => {
        this.handleShipmentCreated(socket, data);
      });

      // Handle new offer created
      socket.on('offer_created', (data) => {
        this.handleOfferCreated(socket, data);
      });

      // Handle offer accepted/rejected
      socket.on('offer_status_changed', (data) => {
        this.handleOfferStatusChanged(socket, data);
      });

      // Handle shipment status changed
      socket.on('shipment_status_changed', (data) => {
        this.handleShipmentStatusChanged(socket, data);
      });

      // Handle new message
      socket.on('send_message', (data) => {
        this.handleNewMessage(socket, data);
      });

      // Handle join shipment room
      socket.on('join_shipment', (shipmentId) => {
        socket.join(`shipment_${shipmentId}`);
        console.log(`User ${socket.userId} joined shipment ${shipmentId}`);
      });

      // Handle leave shipment room
      socket.on('leave_shipment', (shipmentId) => {
        socket.leave(`shipment_${shipmentId}`);
        console.log(`User ${socket.userId} left shipment ${shipmentId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(`shipment_${data.shipmentId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`shipment_${data.shipmentId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: false
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`❌ User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.userSockets.delete(socket.id);
      });
    });
  }

  // Handle new shipment created
  async handleShipmentCreated(socket, data) {
    try {
      const { shipmentId, title, fromLocation, toLocation } = data;
      
      // Notify all carriers about new shipment
      this.io.to('panel_nakliyeci').to('panel_tasiyici').emit('new_shipment', {
        shipmentId,
        title,
        fromLocation,
        toLocation,
        timestamp: new Date().toISOString()
      });

      // Create notification in database
      await this.createNotification('panel_nakliyeci', 'Yeni Yük İlanı', `${title} - ${fromLocation} → ${toLocation}`);
      await this.createNotification('panel_tasiyici', 'Yeni İş İlanı', `${title} - ${fromLocation} → ${toLocation}`);

    } catch (error) {
      console.error('Error handling shipment created:', error);
    }
  }

  // Handle new offer created
  async handleOfferCreated(socket, data) {
    try {
      const { offerId, shipmentId, carrierId, price } = data;
      
      // Get shipment owner
      const shipment = await this.getShipmentOwner(shipmentId);
      if (shipment) {
        // Notify shipment owner
        this.io.to(`user_${shipment.userId}`).emit('new_offer', {
          offerId,
          shipmentId,
          carrierId,
          price,
          timestamp: new Date().toISOString()
        });

        // Create notification
        await this.createNotification(shipment.userId, 'Yeni Teklif', 'Gönderiniz için yeni bir teklif alındı');
      }

    } catch (error) {
      console.error('Error handling offer created:', error);
    }
  }

  // Handle offer status changed
  async handleOfferStatusChanged(socket, data) {
    try {
      const { offerId, shipmentId, carrierId, status } = data;
      
      // Notify carrier about offer status change
      this.io.to(`user_${carrierId}`).emit('offer_status_changed', {
        offerId,
        shipmentId,
        status,
        timestamp: new Date().toISOString()
      });

      // Create notification
      await this.createNotification(carrierId, 'Teklif Durumu Değişti', `Teklifiniz ${status === 'accepted' ? 'kabul edildi' : 'reddedildi'}`);

    } catch (error) {
      console.error('Error handling offer status changed:', error);
    }
  }

  // Handle shipment status changed
  async handleShipmentStatusChanged(socket, data) {
    try {
      const { shipmentId, status, userId } = data;
      
      // Notify all users involved in this shipment
      this.io.to(`shipment_${shipmentId}`).emit('shipment_status_changed', {
        shipmentId,
        status,
        timestamp: new Date().toISOString()
      });

      // Create notification for shipment owner
      await this.createNotification(userId, 'Gönderi Durumu Değişti', `Gönderinizin durumu ${status} olarak güncellendi`);

    } catch (error) {
      console.error('Error handling shipment status changed:', error);
    }
  }

  // Handle new message
  async handleNewMessage(socket, data) {
    try {
      const { shipmentId, message, receiverId } = data;
      
      // Save message to database
      await this.saveMessage(socket.userId, receiverId, shipmentId, message);
      
      // Send message to receiver
      this.io.to(`user_${receiverId}`).emit('new_message', {
        senderId: socket.userId,
        shipmentId,
        message,
        timestamp: new Date().toISOString()
      });

      // Send message to shipment room
      this.io.to(`shipment_${shipmentId}`).emit('message_received', {
        senderId: socket.userId,
        shipmentId,
        message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }

  // Helper methods
  async createNotification(userIdOrPanel, title, message) {
    return new Promise((resolve, reject) => {
      if (userIdOrPanel.startsWith('panel_')) {
        // Create notification for all users in panel
        const panelType = userIdOrPanel.replace('panel_', '');
        db.run(
          `INSERT INTO notifications (user_id, title, message, type) 
           SELECT id, ?, ?, 'info' FROM users WHERE panel_type = ?`,
          [title, message, panelType],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      } else {
        // Create notification for specific user
        db.run(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')`,
          [userIdOrPanel, title, message],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      }
    });
  }

  async getShipmentOwner(shipmentId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT user_id FROM shipments WHERE id = ?`,
        [shipmentId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async saveMessage(senderId, receiverId, shipmentId, message) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (sender_id, receiver_id, shipment_id, message) VALUES (?, ?, ?, ?)`,
        [senderId, receiverId, shipmentId, message],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Public methods for external use
  notifyUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  notifyPanel(panelType, event, data) {
    this.io.to(`panel_${panelType}`).emit(event, data);
  }

  notifyShipment(shipmentId, event, data) {
    this.io.to(`shipment_${shipmentId}`).emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketHandler;





