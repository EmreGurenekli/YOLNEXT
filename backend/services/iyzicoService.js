const https = require('https');
const crypto = require('crypto');

class IyzicoService {
  constructor() {
    this.apiKey = process.env.IYZICO_API_KEY;
    this.secretKey = process.env.IYZICO_SECRET_KEY;
    this.baseUrl = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com';
    this.sandboxUrl = 'https://sandbox-api.iyzipay.com';
    
    // Production için baseUrl, development için sandbox
    this.isSandbox = process.env.NODE_ENV !== 'production' || !this.apiKey;
    this.url = this.isSandbox ? this.sandboxUrl : this.baseUrl;
  }

  /**
   * İyzico API için gerekli header'ları oluşturur
   */
  createHeaders(request, randomString) {
    const hashString = this.apiKey + randomString + this.secretKey + request;
    const hash = crypto.createHash('sha256').update(hashString).digest('base64');
    
    return {
      'Authorization': `IYZWS ${this.apiKey}:${hash}`,
      'Content-Type': 'application/json',
      'x-iyzi-rnd': randomString,
      'x-iyzi-client-version': 'iyzipay-node-2.0.48'
    };
  }

  /**
   * İyzico API'ye istek gönderir
   */
  async makeRequest(endpoint, requestData) {
    return new Promise((resolve, reject) => {
      const randomString = this.generateRandomString();
      const requestBody = JSON.stringify(requestData);
      
      const headers = this.createHeaders(requestBody, randomString);
      
      const options = {
        hostname: this.url.replace('https://', ''),
        port: 443,
        path: endpoint,
        method: 'POST',
        headers: headers
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response: ' + data));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Ödeme oluşturur (3D Secure desteğiyle)
   */
  async createPayment(requestData) {
    try {
      const paymentRequest = {
        locale: 'tr',
        conversationId: requestData.conversationId || `CONV_${Date.now()}`,
        price: requestData.price.toString(),
        paidPrice: requestData.paidPrice || requestData.price.toString(),
        currency: 'TRY',
        installment: requestData.installment || '1',
        basketId: requestData.basketId || requestData.conversationId,
        paymentChannel: 'WEB',
        paymentGroup: 'PRODUCT',
        callbackUrl: requestData.callbackUrl || `${process.env.FRONTEND_ORIGIN}/payment/callback`,
        enabledInstallments: requestData.enabledInstallments || [2, 3, 6, 9],
        buyer: requestData.buyer,
        shippingAddress: requestData.shippingAddress,
        billingAddress: requestData.billingAddress || requestData.shippingAddress,
        basketItems: requestData.basketItems,
        ...(requestData.paymentCard && { paymentCard: requestData.paymentCard }),
        ...(requestData.currency && { currency: requestData.currency })
      };

      // Sandbox modunda veya API key yoksa mock response döndür
      if (this.isSandbox || !this.apiKey || !this.secretKey) {
        console.warn('⚠️ Iyzico API keys not set, using mock payment');
        return {
          status: 'success',
          paymentId: 'mock_payment_' + Date.now(),
          htmlContent: '<html><body>Mock Payment Success</body></html>',
          threeDSHtmlContent: null,
          errorMessage: null,
          errorCode: null
        };
      }

      const response = await this.makeRequest('/payment/auth', paymentRequest);
      
      return {
        status: response.status,
        paymentId: response.paymentId,
        htmlContent: response.htmlContent,
        threeDSHtmlContent: response.threeDSHtmlContent,
        errorMessage: response.errorMessage,
        errorCode: response.errorCode,
        conversationId: response.conversationId
      };
    } catch (error) {
      console.error('Iyzico payment error:', error);
      return {
        status: 'failure',
        errorMessage: error.message,
        errorCode: 'PAYMENT_ERROR'
      };
    }
  }

  /**
   * Ödeme durumunu sorgular
   */
  async getPaymentStatus(paymentId) {
    try {
      const requestData = {
        locale: 'tr',
        paymentId: paymentId,
        conversationId: `CONV_${Date.now()}`
      };

      if (this.isSandbox || !this.apiKey || !this.secretKey) {
        return {
          status: 'success',
          paymentStatus: 'SUCCESS',
          fraudStatus: 1,
          price: '100.00',
          paidPrice: '100.00',
          currency: 'TRY'
        };
      }

      const response = await this.makeRequest('/payment/retrieve', requestData);
      
      return {
        status: response.status,
        paymentStatus: response.paymentStatus,
        fraudStatus: response.fraudStatus,
        price: response.price,
        paidPrice: response.paidPrice,
        currency: response.currency,
        errorMessage: response.errorMessage,
        errorCode: response.errorCode
      };
    } catch (error) {
      console.error('Iyzico payment status error:', error);
      return {
        status: 'failure',
        errorMessage: error.message
      };
    }
  }

  /**
   * Ödeme iptal eder (geri ödeme)
   */
  async cancelPayment(paymentId, amount, reason = 'USER_REQUEST') {
    try {
      const requestData = {
        locale: 'tr',
        paymentId: paymentId,
        ip: '127.0.0.1',
        reason: reason,
        ...(amount && { amount: amount.toString() })
      };

      if (this.isSandbox || !this.apiKey || !this.secretKey) {
        return {
          status: 'success',
          paymentId: paymentId,
          price: amount ? amount.toString() : '0.00',
          currency: 'TRY'
        };
      }

      const response = await this.makeRequest('/payment/cancel', requestData);
      
      return {
        status: response.status,
        paymentId: response.paymentId,
        price: response.price,
        currency: response.currency,
        errorMessage: response.errorMessage,
        errorCode: response.errorCode
      };
    } catch (error) {
      console.error('Iyzico cancel payment error:', error);
      return {
        status: 'failure',
        errorMessage: error.message
      };
    }
  }

  /**
   * Random string oluşturur (İyzico gereksinimi)
   */
  generateRandomString() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = new IyzicoService();

