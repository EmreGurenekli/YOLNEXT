let stripe = null;
try {
  // Optional dependency: in local/dev we allow running without Stripe installed.
  // This keeps the app functional while payment infrastructure is not enabled.
  // eslint-disable-next-line global-require
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');
} catch (_e) {
  stripe = null;
}

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  async createPaymentIntent(amount, currency = 'try', metadata = {}) {
    if (!this.stripe) {
      return this.createMockPayment(amount, { ...metadata, provider: 'stripe', reason: 'stripe_not_configured' });
    }
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe kuruş cinsinden ister
        currency: currency,
        metadata: metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Payment intent oluşturma hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async confirmPayment(paymentIntentId) {
    if (!this.stripe) {
      return {
        success: true,
        status: 'succeeded',
        amount: 0,
        provider: 'mock',
        paymentIntentId,
      };
    }
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          status: 'succeeded',
          amount: paymentIntent.amount / 100
        };
      } else {
        return {
          success: false,
          status: paymentIntent.status,
          error: 'Payment not completed'
        };
      }
    } catch (error) {
      console.error('Payment confirmation hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createKontorPurchase(userId, amount, price) {
    try {
      const paymentIntent = await this.createPaymentIntent(price, 'try', {
        userId: userId,
        type: 'kontor_purchase',
        amount: amount
      });

      if (paymentIntent.success) {
        return {
          success: true,
          clientSecret: paymentIntent.clientSecret,
          paymentIntentId: paymentIntent.paymentIntentId
        };
      } else {
        return paymentIntent;
      }
    } catch (error) {
      console.error('Kontör satın alma hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Demo için mock payment
  async createMockPayment(amount, metadata = {}) {
    console.log(`💳 Mock Payment: ${amount} TL - ${JSON.stringify(metadata)}`);
    return {
      success: true,
      clientSecret: 'mock_client_secret_' + Date.now(),
      paymentIntentId: 'mock_pi_' + Date.now(),
      provider: 'mock',
    };
  }
}

module.exports = new PaymentService();


