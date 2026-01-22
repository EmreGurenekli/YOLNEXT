// Notification helper utility
function createNotificationHelper(pool, io) {
  /**
   * Create a notification for a user
   * @param {number} userId - The user ID to notify
   * @param {string} type - Notification type (e.g., 'shipment_created', 'new_offer')
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} linkUrl - Optional link URL
   * @param {string} priority - Priority level ('low', 'normal', 'high')
   * @param {object} metadata - Optional metadata object
   * @returns {Promise<object>} Created notification
   */
  return async function createNotification(userId, type, title, message, linkUrl = null, priority = 'normal', metadata = null) {
    try {
      if (!pool) {
        console.error('Database pool not available for notifications');
        return null;
      }

      // Backwards/forwards compatibility:
      // Some routes call createNotification(userId, type, title, ...)
      // Others call createNotification({ userId, type, title, message, linkUrl, priority, metadata, ... })
      if (userId && typeof userId === 'object' && !Array.isArray(userId)) {
        const payload = userId;
        userId = payload.userId;
        type = payload.type;
        title = payload.title;
        message = payload.message;
        linkUrl = payload.linkUrl ?? payload.link_url ?? payload.url ?? null;
        priority = payload.priority ?? 'normal';

        if (payload.metadata != null) {
          metadata = payload.metadata;
        } else {
          const derived = {};
          if (payload.shipmentId != null) derived.shipmentId = payload.shipmentId;
          if (payload.offerId != null) derived.offerId = payload.offerId;
          if (payload.driverId != null) derived.driverId = payload.driverId;
          metadata = Object.keys(derived).length > 0 ? derived : null;
        }
      }

      if (userId == null || type == null || title == null || message == null) {
        return null;
      }

      // Try different column names for compatibility
      let result;
      const insertValues = [
        userId,
        type,
        title,
        message,
        linkUrl,
        priority,
        metadata ? JSON.stringify(metadata) : null
      ];
      
      // Try userid (lowercase) first, then user_id, then userId
      try {
        result = await pool.query(
          `INSERT INTO notifications (userid, type, title, message, linkUrl, priority, metadata, createdAt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           RETURNING *`,
          insertValues
        );
      } catch (colError1) {
        if (colError1 && colError1.code === '42703') {
          try {
            result = await pool.query(
              `INSERT INTO notifications ("user_id", type, title, message, linkUrl, priority, metadata, createdAt)
               VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
               RETURNING *`,
              insertValues
            );
          } catch (colError2) {
            if (colError2 && colError2.code === '42703') {
              try {
                result = await pool.query(
                  `INSERT INTO notifications ("userId", type, title, message, linkUrl, priority, metadata, createdAt)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                   RETURNING *`,
                  insertValues
                );
              } catch (colError3) {
                if (colError3 && colError3.code === '42703') {
                  // created_at support
                  result = await pool.query(
                    `INSERT INTO notifications ("userId", type, title, message, linkUrl, priority, metadata, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                     RETURNING *`,
                    insertValues
                  );
                } else {
                  throw colError3;
                }
              }
            } else {
              throw colError2;
            }
          }
        } else {
          throw colError1;
        }
      }

      const notification = result.rows[0];

      // Emit real-time notification via Socket.IO if available
      if (io) {
        const createdAt = notification.createdAt || notification.created_at || notification.createdat || notification.created_at || null;
        io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          linkUrl: notification.linkurl,
          priority: notification.priority,
          metadata: notification.metadata,
          createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  };
}

module.exports = { createNotificationHelper };
