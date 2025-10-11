const { db } = require('../database/init');
const { Server } = require('socket.io');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Bildirim oluştur
  async createNotification(userId, type, title, message, data = null) {
    try {
      const result = await db.run(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, type, title, message, JSON.stringify(data)]);

      // WebSocket ile gerçek zamanlı bildirim gönder
      this.io.to(`user_${userId}`).emit('notification', {
        id: result.lastID,
        type,
        title,
        message,
        data,
        created_at: new Date().toISOString()
      });

      return result.lastID;
    } catch (error) {
      console.error('Bildirim oluşturma hatası:', error);
      throw error;
    }
  }

  // Kullanıcının bildirimlerini getir
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const notifications = await db.all(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      return notifications;
    } catch (error) {
      console.error('Bildirim listeleme hatası:', error);
      throw error;
    }
  }

  // Bildirimi okundu olarak işaretle
  async markAsRead(notificationId, userId) {
    try {
      await db.run(`
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

      return true;
    } catch (error) {
      console.error('Bildirim okundu işaretleme hatası:', error);
      throw error;
    }
  }

  // Tüm bildirimleri okundu olarak işaretle
  async markAllAsRead(userId) {
    try {
      await db.run(`
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND is_read = false
      `, [userId]);

      return true;
    } catch (error) {
      console.error('Tüm bildirimleri okundu işaretleme hatası:', error);
      throw error;
    }
  }

  // Okunmamış bildirim sayısı
  async getUnreadCount(userId) {
    try {
      const result = await db.get(`
        SELECT COUNT(*) as count
        FROM notifications 
        WHERE user_id = ? AND is_read = false
      `, [userId]);

      return result.count;
    } catch (error) {
      console.error('Okunmamış bildirim sayısı hatası:', error);
      throw error;
    }
  }

  // Gönderi oluşturuldu bildirimi
  async notifyShipmentCreated(shipmentId, carrierIds) {
    try {
      const shipment = await db.get(`
        SELECT s.*, u.first_name, u.last_name, u.company_name
        FROM shipments s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `, [shipmentId]);

      if (!shipment) return;

      const title = 'Yeni Gönderi';
      const message = `${shipment.company_name || shipment.first_name + ' ' + shipment.last_name} tarafından yeni bir gönderi oluşturuldu: ${shipment.title}`;

      for (const carrierId of carrierIds) {
        await this.createNotification(carrierId, 'shipment_created', title, message, {
          shipment_id: shipmentId,
          shipment_title: shipment.title,
          pickup_city: shipment.pickup_city,
          delivery_city: shipment.delivery_city,
          budget_min: shipment.budget_min,
          budget_max: shipment.budget_max
        });
      }
    } catch (error) {
      console.error('Gönderi oluşturuldu bildirimi hatası:', error);
    }
  }

  // Teklif verildi bildirimi
  async notifyOfferReceived(shipmentId, offerId) {
    try {
      const offer = await db.get(`
        SELECT o.*, s.user_id as shipment_owner_id, s.title as shipment_title,
               u.first_name, u.last_name, u.company_name
        FROM offers o
        JOIN shipments s ON o.shipment_id = s.id
        JOIN users u ON o.carrier_id = u.id
        WHERE o.id = ?
      `, [offerId]);

      if (!offer) return;

      const title = 'Yeni Teklif';
      const message = `${offer.company_name || offer.first_name + ' ' + offer.last_name} gönderinize teklif verdi: ${offer.price} TL`;

      await this.createNotification(offer.shipment_owner_id, 'offer_received', title, message, {
        offer_id: offerId,
        shipment_id: shipmentId,
        shipment_title: offer.shipment_title,
        carrier_name: offer.company_name || offer.first_name + ' ' + offer.last_name,
        price: offer.price
      });
    } catch (error) {
      console.error('Teklif verildi bildirimi hatası:', error);
    }
  }

  // Teklif kabul edildi bildirimi
  async notifyOfferAccepted(offerId) {
    try {
      const offer = await db.get(`
        SELECT o.*, s.title as shipment_title,
               u.first_name, u.last_name, u.company_name
        FROM offers o
        JOIN shipments s ON o.shipment_id = s.id
        JOIN users u ON o.carrier_id = u.id
        WHERE o.id = ?
      `, [offerId]);

      if (!offer) return;

      const title = 'Teklifiniz Kabul Edildi';
      const message = `${offer.shipment_title} gönderisi için verdiğiniz teklif kabul edildi!`;

      await this.createNotification(offer.carrier_id, 'offer_accepted', title, message, {
        offer_id: offerId,
        shipment_title: offer.shipment_title,
        price: offer.price
      });
    } catch (error) {
      console.error('Teklif kabul edildi bildirimi hatası:', error);
    }
  }

  // Sipariş durumu değişti bildirimi
  async notifyOrderStatusChanged(orderId, newStatus) {
    try {
      const order = await db.get(`
        SELECT o.*, s.title as shipment_title,
               c.first_name as customer_name, c.last_name as customer_surname,
               cr.first_name as carrier_name, cr.last_name as carrier_surname
        FROM orders o
        JOIN shipments s ON o.shipment_id = s.id
        JOIN users c ON o.customer_id = c.id
        JOIN users cr ON o.carrier_id = cr.id
        WHERE o.id = ?
      `, [orderId]);

      if (!order) return;

      let title, message;

      switch (newStatus) {
        case 'in_progress':
          title = 'Sipariş Başladı';
          message = `${order.shipment_title} gönderisi için siparişiniz başladı.`;
          break;
        case 'picked_up':
          title = 'Gönderi Alındı';
          message = `${order.shipment_title} gönderisi alındı ve yola çıktı.`;
          break;
        case 'in_transit':
          title = 'Gönderi Yolda';
          message = `${order.shipment_title} gönderisi yolda.`;
          break;
        case 'delivered':
          title = 'Gönderi Teslim Edildi';
          message = `${order.shipment_title} gönderisi başarıyla teslim edildi.`;
          break;
        case 'cancelled':
          title = 'Sipariş İptal Edildi';
          message = `${order.shipment_title} gönderisi için siparişiniz iptal edildi.`;
          break;
        default:
          return;
      }

      // Müşteriye bildirim
      await this.createNotification(order.customer_id, 'order_status_changed', title, message, {
        order_id: orderId,
        shipment_title: order.shipment_title,
        status: newStatus
      });

      // Taşıyıcıya bildirim
      await this.createNotification(order.carrier_id, 'order_status_changed', title, message, {
        order_id: orderId,
        shipment_title: order.shipment_title,
        status: newStatus
      });
    } catch (error) {
      console.error('Sipariş durumu değişti bildirimi hatası:', error);
    }
  }

  // Mesaj geldi bildirimi
  async notifyMessageReceived(conversationId, messageId) {
    try {
      const message = await db.get(`
        SELECT m.*, c.participant1_id, c.participant2_id,
               s.first_name as sender_name, s.last_name as sender_surname
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        JOIN users s ON m.sender_id = s.id
        WHERE m.id = ?
      `, [messageId]);

      if (!message) return;

      const recipientId = message.participant1_id === message.sender_id ? 
        message.participant2_id : message.participant1_id;

      const title = 'Yeni Mesaj';
      const messageText = message.content.length > 50 ? 
        message.content.substring(0, 50) + '...' : message.content;

      await this.createNotification(recipientId, 'message_received', title, messageText, {
        conversation_id: conversationId,
        message_id: messageId,
        sender_name: message.sender_name + ' ' + message.sender_surname
      });
    } catch (error) {
      console.error('Mesaj geldi bildirimi hatası:', error);
    }
  }

  // Ödeme tamamlandı bildirimi
  async notifyPaymentCompleted(orderId) {
    try {
      const order = await db.get(`
        SELECT o.*, s.title as shipment_title,
               c.first_name as customer_name, c.last_name as customer_surname
        FROM orders o
        JOIN shipments s ON o.shipment_id = s.id
        JOIN users c ON o.customer_id = c.id
        WHERE o.id = ?
      `, [orderId]);

      if (!order) return;

      const title = 'Ödeme Tamamlandı';
      const message = `${order.shipment_title} gönderisi için ödeme başarıyla tamamlandı.`;

      // Müşteriye bildirim
      await this.createNotification(order.customer_id, 'payment_completed', title, message, {
        order_id: orderId,
        shipment_title: order.shipment_title,
        amount: order.total_amount
      });

      // Taşıyıcıya bildirim
      await this.createNotification(order.carrier_id, 'payment_completed', title, message, {
        order_id: orderId,
        shipment_title: order.shipment_title,
        amount: order.carrier_amount
      });
    } catch (error) {
      console.error('Ödeme tamamlandı bildirimi hatası:', error);
    }
  }

  // Sistem bakım bildirimi
  async notifySystemMaintenance(message) {
    try {
      // Tüm aktif kullanıcılara bildirim gönder
      const users = await db.all('SELECT id FROM users WHERE is_active = true');

      for (const user of users) {
        await this.createNotification(user.id, 'system_maintenance', 'Sistem Bakımı', message, {
          type: 'maintenance'
        });
      }
    } catch (error) {
      console.error('Sistem bakım bildirimi hatası:', error);
    }
  }
}

module.exports = NotificationService;




