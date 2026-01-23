const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const iyzicoService = require('../services/iyzicoService');

const router = express.Router();

// İyzico entegrasyonu için gerekli bilgiler
const IYZICO_CONFIG = {
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
  baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  currency: 'TRY',
};

// Ödeme oluşturma
router.post(
  '/create',
  authenticateToken,
  [
    body('order_id').isInt().withMessage('Geçerli sipariş ID gerekli'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Geçerli tutar gerekli'),
    body('payment_method')
      .isIn(['credit_card', 'bank_transfer', 'wallet'])
      .withMessage('Geçerli ödeme yöntemi gerekli'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array(),
        });
      }

      const { order_id, amount, payment_method, card_token } = req.body;

      // Sipariş kontrolü
      const order = await db.get(
        `
      SELECT o.*, s.title, s.pickup_city, s.delivery_city,
             c.first_name as customer_name, c.last_name as customer_surname, c.email as customer_email
      FROM orders o
      JOIN shipments s ON o.shipment_id = s.id
      JOIN users c ON o.customer_id = c.id
      WHERE o.id = ? AND o.customer_id = ? AND o.payment_status = 'pending'
    `,
        [order_id, req.user.id]
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sipariş bulunamadı veya ödeme yapılamaz',
        });
      }

      // Tutar kontrolü
      if (Math.abs(amount - order.total_amount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Tutar uyuşmuyor',
        });
      }

      // Ödeme referansı oluştur
      const payment_reference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (payment_method === 'wallet') {
        // Cüzdan ödemesi
        const wallet = await db.get('SELECT * FROM wallets WHERE user_id = ?', [
          req.user.id,
        ]);
        if (!wallet || wallet.balance < amount) {
          return res.status(400).json({
            success: false,
            message: 'Yetersiz bakiye',
          });
        }

        // Cüzdan bakiyesini düş
        await db.run(
          'UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
          [amount, req.user.id]
        );

        // İşlem kaydı oluştur
        await db.run(
          `
        INSERT INTO transactions (wallet_id, user_id, type, amount, balance_before, balance_after, 
                                reference_type, reference_id, description)
        VALUES (?, ?, 'payment', ?, ?, ?, 'order', ?, ?)
      `,
          [
            wallet.id,
            req.user.id,
            amount,
            wallet.balance,
            wallet.balance - amount,
            order_id,
            `Sipariş ödemesi - ${order.title}`,
          ]
        );

        // Sipariş durumunu güncelle
        await db.run(
          `
        UPDATE orders 
        SET payment_status = 'paid', payment_method = 'wallet', payment_reference = ?
        WHERE id = ?
      `,
          [payment_reference, order_id]
        );

        res.json({
          success: true,
          message: 'Ödeme başarıyla tamamlandı',
          data: {
            payment_reference,
            amount,
            payment_method: 'wallet',
          },
        });
      } else if (payment_method === 'credit_card') {
        // Kredi kartı ödemesi (İyzico entegrasyonu)
        const iyzicoRequest = {
          locale: 'tr',
          conversationId: payment_reference,
          price: amount.toString(),
          paidPrice: amount.toString(),
          currency: IYZICO_CONFIG.currency,
          installment: '1',
          basketId: order_id.toString(),
          paymentChannel: 'WEB',
          paymentGroup: 'PRODUCT',
          callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`,
          enabledInstallments: [2, 3, 6, 9],
          buyer: {
            id: req.user.id.toString(),
            name: order.customer_name,
            surname: order.customer_surname,
            email: order.customer_email,
            identityNumber: '11111111111', // Gerçek uygulamada kullanıcıdan alınmalı
            city: order.pickup_city,
            country: 'Turkey',
            registrationAddress: order.pickup_city,
            ip: req.ip,
          },
          shippingAddress: {
            contactName: order.customer_name + ' ' + order.customer_surname,
            city: order.pickup_city,
            country: 'Turkey',
            address: order.pickup_city,
          },
          billingAddress: {
            contactName: order.customer_name + ' ' + order.customer_surname,
            city: order.pickup_city,
            country: 'Turkey',
            address: order.pickup_city,
          },
          basketItems: [
            {
              id: order_id.toString(),
              name: order.title,
              category1: 'Kargo',
              itemType: 'PHYSICAL',
              price: amount.toString(),
            },
          ],
        };

        // İyzico API çağrısı (gerçek entegrasyon)
        const iyzicoResponse = await makeIyzicoPayment(iyzicoRequest);

        if (iyzicoResponse.status === 'success') {
          // Sipariş durumunu güncelle
          await db.run(
            `
          UPDATE orders 
          SET payment_status = 'paid', payment_method = 'credit_card', payment_reference = ?
          WHERE id = ?
        `,
            [payment_reference, order_id]
          );

          res.json({
            success: true,
            message: 'Ödeme başarıyla tamamlandı',
            data: {
              payment_reference,
              amount,
              payment_method: 'credit_card',
              iyzico_payment_id: iyzicoResponse.paymentId,
            },
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Ödeme işlemi başarısız',
            error: iyzicoResponse.errorMessage,
          });
        }
      } else if (payment_method === 'bank_transfer') {
        // Banka havalesi
        const bankAccount = {
          bank_name: 'YolNext Bankası',
          account_name: 'YolNext Kargo A.Ş.',
          iban: 'TR1234567890123456789012345',
          account_number: '1234567890',
        };

        // Sipariş durumunu güncelle
        await db.run(
          `
        UPDATE orders 
        SET payment_status = 'pending', payment_method = 'bank_transfer', payment_reference = ?
        WHERE id = ?
      `,
          [payment_reference, order_id]
        );

        res.json({
          success: true,
          message: 'Banka havalesi bilgileri oluşturuldu',
          data: {
            payment_reference,
            amount,
            payment_method: 'bank_transfer',
            bank_account: bankAccount,
            instructions:
              'Lütfen açıklama kısmına ödeme referansınızı yazın: ' +
              payment_reference,
          },
        });
      }
    } catch (error) {
      console.error('Ödeme oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// Ödeme durumu sorgulama
router.get(
  '/status/:payment_reference',
  authenticateToken,
  async (req, res) => {
    try {
      const { payment_reference } = req.params;

      const order = await db.get(
        `
      SELECT o.*, s.title
      FROM orders o
      JOIN shipments s ON o.shipment_id = s.id
      WHERE o.payment_reference = ? AND o.customer_id = ?
    `,
        [payment_reference, req.user.id]
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Ödeme bulunamadı',
        });
      }

      res.json({
        success: true,
        data: {
          payment_reference,
          amount: order.total_amount,
          status: order.payment_status,
          payment_method: order.payment_method,
          created_at: order.confirmed_at,
        },
      });
    } catch (error) {
      console.error('Ödeme durumu sorgulama hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// Cüzdan bakiyesi
router.get('/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const wallet = await db.get('SELECT * FROM wallets WHERE user_id = ?', [
      req.user.id,
    ]);

    if (!wallet) {
      // Cüzdan oluştur
      const result = await db.run('INSERT INTO wallets (user_id) VALUES (?)', [
        req.user.id,
      ]);
      const newWallet = await db.get('SELECT * FROM wallets WHERE id = ?', [
        result.lastID,
      ]);

      return res.json({
        success: true,
        data: {
          balance: newWallet.balance,
          currency: newWallet.currency,
        },
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    console.error('Cüzdan bakiye hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
});

// Cüzdana para yatırma
router.post(
  '/wallet/deposit',
  authenticateToken,
  [
    body('amount')
      .isFloat({ min: 10 })
      .withMessage('Minimum 10 TL yatırabilirsiniz'),
    body('payment_method')
      .isIn(['credit_card', 'bank_transfer'])
      .withMessage('Geçerli ödeme yöntemi gerekli'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array(),
        });
      }

      const { amount, payment_method } = req.body;

      // Cüzdan kontrolü/oluşturma
      let wallet = await db.get('SELECT * FROM wallets WHERE user_id = ?', [
        req.user.id,
      ]);
      if (!wallet) {
        const result = await db.run(
          'INSERT INTO wallets (user_id) VALUES (?)',
          [req.user.id]
        );
        wallet = await db.get('SELECT * FROM wallets WHERE id = ?', [
          result.lastID,
        ]);
      }

      // Ödeme işlemi (basitleştirilmiş)
      const transaction_reference = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Cüzdan bakiyesini artır
      await db.run(
        'UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [amount, req.user.id]
      );

      // İşlem kaydı oluştur
      await db.run(
        `
      INSERT INTO transactions (wallet_id, user_id, type, amount, balance_before, balance_after, 
                              reference_type, description)
      VALUES (?, ?, 'deposit', ?, ?, ?, 'wallet', ?)
    `,
        [
          wallet.id,
          req.user.id,
          amount,
          wallet.balance,
          wallet.balance + amount,
          `Cüzdana para yatırma - ${payment_method}`,
        ]
      );

      res.json({
        success: true,
        message: 'Para başarıyla yatırıldı',
        data: {
          transaction_reference,
          amount,
          new_balance: wallet.balance + amount,
        },
      });
    } catch (error) {
      console.error('Para yatırma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// İyzico ödeme fonksiyonu (gerçek entegrasyon)
async function makeIyzicoPayment(request) {
  try {
    const response = await iyzicoService.createPayment(request);
    
    // 3D Secure varsa HTML içeriği döndür
    if (response.threeDSHtmlContent) {
      return {
        status: '3d_secure_required',
        htmlContent: response.threeDSHtmlContent,
        paymentId: response.paymentId,
        conversationId: response.conversationId
      };
    }
    
    // Direkt ödeme başarılıysa
    if (response.status === 'success' && response.htmlContent) {
      return {
        status: 'success',
        paymentId: response.paymentId,
        htmlContent: response.htmlContent,
        conversationId: response.conversationId
      };
    }
    
    // Hata durumu
    return {
      status: 'failure',
      errorMessage: response.errorMessage || 'Ödeme işlemi başarısız',
      errorCode: response.errorCode
    };
  } catch (error) {
    console.error('Iyzico payment error:', error);
    return {
      status: 'failure',
      errorMessage: error.message || 'Ödeme işlemi sırasında hata oluştu'
    };
  }
}

module.exports = router;
