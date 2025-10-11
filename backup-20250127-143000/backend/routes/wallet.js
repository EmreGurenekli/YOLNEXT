const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT * FROM wallets WHERE user_id = ? AND is_active = 1`,
    [userId],
    (err, wallet) => {
      if (err) {
        console.error('Get wallet balance error:', err);
        return res.status(500).json({ error: 'Failed to fetch wallet balance' });
      }

      if (!wallet) {
        // Create wallet if it doesn't exist
        db.run(
          `INSERT INTO wallets (user_id, balance, currency) VALUES (?, 0, 'TRY')`,
          [userId],
          function(err) {
            if (err) {
              console.error('Create wallet error:', err);
              return res.status(500).json({ error: 'Failed to create wallet' });
            }

            res.json({
              balance: 0,
              currency: 'TRY',
              is_active: true
            });
          }
        );
      } else {
        res.json(wallet);
      }
    }
  );
});

// Get wallet transactions
router.get('/transactions', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10, type } = req.query;

  let query = `
    SELECT t.*, w.balance as current_balance 
    FROM transactions t 
    JOIN wallets w ON t.wallet_id = w.id 
    WHERE t.user_id = ?
  `;
  let params = [userId];

  if (type) {
    query += ` AND t.type = ?`;
    params.push(type);
  }

  query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, transactions) => {
    if (err) {
      console.error('Get transactions error:', err);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.user_id = ?`;
    let countParams = [userId];

    if (type) {
      countQuery += ` AND t.type = ?`;
      countParams.push(type);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Get transactions count error:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions count' });
      }

      res.json({
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
    });
  });
});

// Add funds to wallet
router.post('/deposit', authenticateToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_method').isIn(['credit_card', 'bank_transfer']).withMessage('Invalid payment method')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, payment_method } = req.body;
    const userId = req.user.userId;

    // Get or create wallet
    db.get(
      `SELECT * FROM wallets WHERE user_id = ? AND is_active = 1`,
      [userId],
      (err, wallet) => {
        if (err) {
          console.error('Get wallet error:', err);
          return res.status(500).json({ error: 'Failed to fetch wallet' });
        }

        if (!wallet) {
          // Create wallet
          db.run(
            `INSERT INTO wallets (user_id, balance, currency) VALUES (?, 0, 'TRY')`,
            [userId],
            function(err) {
              if (err) {
                console.error('Create wallet error:', err);
                return res.status(500).json({ error: 'Failed to create wallet' });
              }

              const walletId = this.lastID;
              processDeposit(userId, walletId, amount, payment_method, res);
            }
          );
        } else {
          processDeposit(userId, wallet.id, amount, payment_method, res);
        }
      }
    );
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function processDeposit(userId, walletId, amount, paymentMethod, res) {
  // Get current balance
  db.get(
    `SELECT balance FROM wallets WHERE id = ?`,
    [walletId],
    (err, wallet) => {
      if (err) {
        console.error('Get wallet balance error:', err);
        return res.status(500).json({ error: 'Failed to fetch wallet balance' });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      // Update wallet balance
      db.run(
        `UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [balanceAfter, walletId],
        function(err) {
          if (err) {
            console.error('Update wallet balance error:', err);
            return res.status(500).json({ error: 'Failed to update wallet balance' });
          }

          // Create transaction record
          const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          db.run(
            `INSERT INTO transactions (user_id, wallet_id, type, amount, balance_before, balance_after, description, reference_id, status)
             VALUES (?, ?, 'deposit', ?, ?, ?, ?, ?, 'completed')`,
            [userId, walletId, amount, balanceBefore, balanceAfter, `Deposit via ${paymentMethod}`, transactionId],
            function(err) {
              if (err) {
                console.error('Create transaction error:', err);
                return res.status(500).json({ error: 'Failed to create transaction record' });
              }

              res.json({
                message: 'Deposit successful',
                transaction: {
                  id: this.lastID,
                  amount,
                  balance_before: balanceBefore,
                  balance_after: balanceAfter,
                  type: 'deposit'
                }
              });
            }
          );
        }
      );
    }
  );
}

// Withdraw funds from wallet
router.post('/withdraw', authenticateToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('bank_account').isString().withMessage('Bank account is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, bank_account } = req.body;
    const userId = req.user.userId;

    // Get wallet
    db.get(
      `SELECT * FROM wallets WHERE user_id = ? AND is_active = 1`,
      [userId],
      (err, wallet) => {
        if (err) {
          console.error('Get wallet error:', err);
          return res.status(500).json({ error: 'Failed to fetch wallet' });
        }

        if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.balance < amount) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - amount;

        // Update wallet balance
        db.run(
          `UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [balanceAfter, walletId],
          function(err) {
            if (err) {
              console.error('Update wallet balance error:', err);
              return res.status(500).json({ error: 'Failed to update wallet balance' });
            }

            // Create transaction record
            const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            db.run(
              `INSERT INTO transactions (user_id, wallet_id, type, amount, balance_before, balance_after, description, reference_id, status)
               VALUES (?, ?, 'withdrawal', ?, ?, ?, ?, ?, 'pending')`,
              [userId, wallet.id, amount, balanceBefore, balanceAfter, `Withdrawal to ${bank_account}`, transactionId],
              function(err) {
                if (err) {
                  console.error('Create transaction error:', err);
                  return res.status(500).json({ error: 'Failed to create transaction record' });
                }

                res.json({
                  message: 'Withdrawal request submitted',
                  transaction: {
                    id: this.lastID,
                    amount,
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    type: 'withdrawal',
                    status: 'pending'
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer funds between users
router.post('/transfer', authenticateToken, [
  body('recipient_email').isEmail().withMessage('Valid email is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('message').optional().isString().withMessage('Message must be a string')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient_email, amount, message } = req.body;
    const senderId = req.user.userId;

    // Get recipient user
    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [recipient_email],
      (err, recipient) => {
        if (err) {
          console.error('Get recipient error:', err);
          return res.status(500).json({ error: 'Failed to find recipient' });
        }

        if (!recipient) {
          return res.status(404).json({ error: 'Recipient not found' });
        }

        if (recipient.id === senderId) {
          return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }

        // Get sender wallet
        db.get(
          `SELECT * FROM wallets WHERE user_id = ? AND is_active = 1`,
          [senderId],
          (err, senderWallet) => {
            if (err) {
              console.error('Get sender wallet error:', err);
              return res.status(500).json({ error: 'Failed to fetch sender wallet' });
            }

            if (!senderWallet || senderWallet.balance < amount) {
              return res.status(400).json({ error: 'Insufficient balance' });
            }

            // Get or create recipient wallet
            db.get(
              `SELECT * FROM wallets WHERE user_id = ? AND is_active = 1`,
              [recipient.id],
              (err, recipientWallet) => {
                if (err) {
                  console.error('Get recipient wallet error:', err);
                  return res.status(500).json({ error: 'Failed to fetch recipient wallet' });
                }

                if (!recipientWallet) {
                  // Create recipient wallet
                  db.run(
                    `INSERT INTO wallets (user_id, balance, currency) VALUES (?, 0, 'TRY')`,
                    [recipient.id],
                    function(err) {
                      if (err) {
                        console.error('Create recipient wallet error:', err);
                        return res.status(500).json({ error: 'Failed to create recipient wallet' });
                      }

                      const recipientWalletId = this.lastID;
                      processTransfer(senderId, senderWallet, recipient.id, recipientWalletId, amount, message, res);
                    }
                  );
                } else {
                  processTransfer(senderId, senderWallet, recipient.id, recipientWallet.id, amount, message, res);
                }
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function processTransfer(senderId, senderWallet, recipientId, recipientWalletId, amount, message, res) {
  const senderBalanceBefore = senderWallet.balance;
  const senderBalanceAfter = senderBalanceBefore - amount;

  // Update sender wallet
  db.run(
    `UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [senderBalanceAfter, senderWallet.id],
    function(err) {
      if (err) {
        console.error('Update sender wallet error:', err);
        return res.status(500).json({ error: 'Failed to update sender wallet' });
      }

      // Get recipient current balance
      db.get(
        `SELECT balance FROM wallets WHERE id = ?`,
        [recipientWalletId],
        (err, recipientWallet) => {
          if (err) {
            console.error('Get recipient balance error:', err);
            return res.status(500).json({ error: 'Failed to fetch recipient balance' });
          }

          const recipientBalanceBefore = recipientWallet.balance;
          const recipientBalanceAfter = recipientBalanceBefore + amount;

          // Update recipient wallet
          db.run(
            `UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [recipientBalanceAfter, recipientWalletId],
            function(err) {
              if (err) {
                console.error('Update recipient wallet error:', err);
                return res.status(500).json({ error: 'Failed to update recipient wallet' });
              }

              const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              // Create sender transaction
              db.run(
                `INSERT INTO transactions (user_id, wallet_id, type, amount, balance_before, balance_after, description, reference_id, status)
                 VALUES (?, ?, 'payment', ?, ?, ?, ?, ?, 'completed')`,
                [senderId, senderWallet.id, -amount, senderBalanceBefore, senderBalanceAfter, 
                 `Transfer to ${recipientId}${message ? ': ' + message : ''}`, transactionId],
                function(err) {
                  if (err) {
                    console.error('Create sender transaction error:', err);
                    return res.status(500).json({ error: 'Failed to create sender transaction' });
                  }

                  // Create recipient transaction
                  db.run(
                    `INSERT INTO transactions (user_id, wallet_id, type, amount, balance_before, balance_after, description, reference_id, status)
                     VALUES (?, ?, 'payment', ?, ?, ?, ?, ?, 'completed')`,
                    [recipientId, recipientWalletId, amount, recipientBalanceBefore, recipientBalanceAfter, 
                     `Transfer from ${senderId}${message ? ': ' + message : ''}`, transactionId],
                    function(err) {
                      if (err) {
                        console.error('Create recipient transaction error:', err);
                        return res.status(500).json({ error: 'Failed to create recipient transaction' });
                      }

                      res.json({
                        message: 'Transfer successful',
                        transfer: {
                          transaction_id: transactionId,
                          amount,
                          sender_balance_after: senderBalanceAfter,
                          recipient_balance_after: recipientBalanceAfter
                        }
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

module.exports = router;