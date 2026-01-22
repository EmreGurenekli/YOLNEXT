const webpush = require('web-push');

class PushNotificationService {
  constructor() {
    // VAPID keys (production'da gerçek keys kullanılmalı)
    webpush.setVapidDetails(
      'mailto:admin@YolNext.com',
      process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key',
      process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key'
    );
  }

  async sendNotification(subscription, payload) {
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { success: true, result };
    } catch (error) {
      console.error('Push notification hatası:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleUsers(subscriptions, payload) {
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendNotification(sub, payload))
    );
    
    return {
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  // Demo için mock push notification
  async sendMockNotification(userId, title, message) {
    console.log(`🔔 Mock Push Notification: ${userId} - ${title}: ${message}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
}

module.exports = new PushNotificationService();


