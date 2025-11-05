const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  async createPaymentIntent(amount, currency = 'try', metadata = {}) {
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
      paymentIntentId: 'mock_pi_' + Date.now()
    };
  }
}

module.exports = new PaymentService();


