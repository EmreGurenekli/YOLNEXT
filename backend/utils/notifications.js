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
              result = await pool.query(
                `INSERT INTO notifications ("userId", type, title, message, linkUrl, priority, metadata, createdAt)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                 RETURNING *`,
                insertValues
              );
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
        io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          linkUrl: notification.linkurl,
          priority: notification.priority,
          metadata: notification.metadata,
          createdAt: notification.createdat
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
