// Financial Transparency System - Finansal Şeffaflık Sistemi
// YolNext Admin Panel "Muhasebeci Titizliği" ile Finansal Takip

const express = require('express');
const router = express.Router();

function createFinancialTransparencyRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification) {
  
  router.use(authenticateToken);
  router.use(requireAdmin);

  // Transaction types
  const TRANSACTION_TYPES = {
    COMMISSION: 'commission',
    REFUND: 'refund',
    PAYOUT: 'payout',
    PENALTY: 'penalty',
    BONUS: 'bonus',
    ADJUSTMENT: 'adjustment',
    ESCROW_HOLD: 'escrow_hold',
    ESCROW_RELEASE: 'escrow_release'
  };

  // Transaction statuses
  const TRANSACTION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed'
  };

  // Commission rates by user type
  const COMMISSION_RATES = {
    individual: 0.025, // 2.5%
    corporate: 0.02,   // 2.0%
    nakliyeci: 0.015,  // 1.5%
    tasiyici: 0.01     // 1.0%
  };

  async function safeQuery(query, params = []) {
    if (!pool) return { rows: [] };
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Financial DB error:', error);
      return { rows: [] };
    }
  }

  // Helper function to calculate commission
  function calculateCommission(amount, userType) {
    const rate = COMMISSION_RATES[userType] || COMMISSION_RATES.individual;
    return parseFloat((amount * rate).toFixed(2));
  }

  // GET /api/financial/overview - Financial dashboard overview
  router.get('/overview', async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let intervalClause;
      switch (period) {
        case '7d': intervalClause = "7 days"; break;
        case '30d': intervalClause = "30 days"; break;
        case '90d': intervalClause = "90 days"; break;
        case '1y': intervalClause = "1 year"; break;
        default: intervalClause = "30 days";
      }

      // Total revenue and commissions
      const revenueStats = await safeQuery(`
        SELECT 
          SUM(CASE WHEN transaction_type = 'commission' AND status = 'completed' THEN amount ELSE 0 END) as total_commission,
          SUM(CASE WHEN transaction_type = 'refund' AND status = 'completed' THEN amount ELSE 0 END) as total_refunds,
          SUM(CASE WHEN transaction_type = 'payout' AND status = 'completed' THEN amount ELSE 0 END) as total_payouts,
          COUNT(CASE WHEN transaction_type = 'commission' THEN 1 END) as commission_count
        FROM financial_transactions 
        WHERE created_at >= NOW() - INTERVAL '${intervalClause}'
      `);

      // Platform pool balance (escrow + pending)
      const poolStats = await safeQuery(`
        SELECT 
          SUM(CASE WHEN transaction_type = 'escrow_hold' AND status = 'completed' THEN amount 
                   WHEN transaction_type = 'escrow_release' AND status = 'completed' THEN -amount 
                   ELSE 0 END) as escrow_balance,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount
        FROM financial_transactions
      `);

      // Top earning users
      const topEarners = await safeQuery(`
        SELECT 
          u.email,
          u.role,
          SUM(ft.amount) as total_earned,
          COUNT(ft.id) as transaction_count
        FROM financial_transactions ft
        JOIN users u ON ft.user_id = u.id
        WHERE ft.transaction_type IN ('payout', 'bonus') 
        AND ft.status = 'completed'
        AND ft.created_at >= NOW() - INTERVAL '${intervalClause}'
        GROUP BY u.id, u.email, u.role
        ORDER BY total_earned DESC
        LIMIT 10
      `);

      // Revenue by user type
      const revenueByType = await safeQuery(`
        SELECT 
          u.role,
          SUM(ft.amount) as commission_revenue,
          COUNT(ft.id) as transaction_count,
          AVG(ft.amount) as avg_commission
        FROM financial_transactions ft
        JOIN users u ON ft.user_id = u.id
        WHERE ft.transaction_type = 'commission' 
        AND ft.status = 'completed'
        AND ft.created_at >= NOW() - INTERVAL '${intervalClause}'
        GROUP BY u.role
        ORDER BY commission_revenue DESC
      `);

      // Daily revenue trend (last 30 days)
      const dailyTrend = await safeQuery(`
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN transaction_type = 'commission' AND status = 'completed' THEN amount ELSE 0 END) as commission,
          SUM(CASE WHEN transaction_type = 'refund' AND status = 'completed' THEN amount ELSE 0 END) as refunds,
          COUNT(*) as transaction_count
        FROM financial_transactions 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      const stats = {
        revenue: revenueStats.rows[0] || {},
        pool: poolStats.rows[0] || {},
        topEarners: topEarners.rows || [],
        revenueByType: revenueByType.rows || [],
        dailyTrend: dailyTrend.rows || [],
        period: period,
        generated_at: new Date()
      };

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Financial overview error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch financial overview',
        error: error.message
      });
    }
  });

  // GET /api/financial/transactions - List all financial transactions
  router.get('/transactions', async (req, res) => {
    try {
      const {
        transaction_type = '',
        status = '',
        user_id = '',
        amount_min = '',
        amount_max = '',
        date_from = '',
        date_to = '',
        page = 1,
        limit = 50,
        search = ''
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Build dynamic WHERE clause
      if (transaction_type) {
        whereConditions.push(`ft.transaction_type = $${++paramCount}`);
        params.push(transaction_type);
      }

      if (status) {
        whereConditions.push(`ft.status = $${++paramCount}`);
        params.push(status);
      }

      if (user_id) {
        whereConditions.push(`ft.user_id = $${++paramCount}`);
        params.push(user_id);
      }

      if (amount_min) {
        whereConditions.push(`ft.amount >= $${++paramCount}`);
        params.push(parseFloat(amount_min));
      }

      if (amount_max) {
        whereConditions.push(`ft.amount <= $${++paramCount}`);
        params.push(parseFloat(amount_max));
      }

      if (date_from) {
        whereConditions.push(`ft.created_at >= $${++paramCount}`);
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push(`ft.created_at <= $${++paramCount}`);
        params.push(date_to + ' 23:59:59');
      }

      if (search) {
        whereConditions.push(`(u.email ILIKE $${++paramCount} OR ft.reference_id ILIKE $${paramCount} OR ft.description ILIKE $${paramCount})`);
        params.push(`%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          ft.*,
          u.email as user_email,
          u.role as user_role,
          s.id as shipment_tracking_number,
          admin.email as processed_by_email
        FROM financial_transactions ft
        LEFT JOIN users u ON ft.user_id = u.id
        LEFT JOIN shipments s ON ft.shipment_id = s.id
        LEFT JOIN users admin ON ft.processed_by = admin.id
        ${whereClause}
        ORDER BY ft.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(parseInt(limit), offset);

      const transactions = await safeQuery(query, params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM financial_transactions ft
        LEFT JOIN users u ON ft.user_id = u.id
        ${whereClause}
      `;
      const countResult = await safeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      // Calculate summary stats for current query
      const summaryQuery = `
        SELECT 
          SUM(ft.amount) as total_amount,
          AVG(ft.amount) as avg_amount,
          COUNT(*) as count
        FROM financial_transactions ft
        LEFT JOIN users u ON ft.user_id = u.id
        ${whereClause}
      `;
      const summary = await safeQuery(summaryQuery, params.slice(0, -2));

      return res.json({
        success: true,
        data: transactions.rows,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          summary: summary.rows[0] || {}
        }
      });

    } catch (error) {
      console.error('Get financial transactions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }
  });

  // POST /api/financial/transactions - Create manual transaction
  router.post('/transactions', async (req, res) => {
    try {
      const {
        user_id,
        transaction_type,
        amount,
        description,
        reference_id,
        shipment_id = null,
        metadata = {}
      } = req.body;

      // Validation
      if (!user_id || !transaction_type || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'user_id, transaction_type, and positive amount are required'
        });
      }

      if (!Object.values(TRANSACTION_TYPES).includes(transaction_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction type'
        });
      }

      // Verify user exists
      const userCheck = await safeQuery('SELECT id, email, role FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userCheck.rows[0];

      // Generate unique transaction reference
      const transactionRef = reference_id || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Check for duplicate reference
      if (reference_id) {
        const duplicateCheck = await safeQuery(
          'SELECT id FROM financial_transactions WHERE reference_id = $1',
          [reference_id]
        );
        
        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Transaction with this reference ID already exists'
          });
        }
      }

      // Create transaction
      const insertQuery = `
        INSERT INTO financial_transactions (
          user_id,
          transaction_type,
          amount,
          status,
          reference_id,
          description,
          shipment_id,
          metadata,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const transaction = await safeQuery(insertQuery, [
        user_id,
        transaction_type,
        parseFloat(amount),
        TRANSACTION_STATUS.PENDING,
        transactionRef,
        description || `${transaction_type} transaction`,
        shipment_id,
        JSON.stringify(metadata),
        req.user.id
      ]);

      if (transaction.rows.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create transaction'
        });
      }

      const newTransaction = transaction.rows[0];

      // Auto-process certain transaction types
      if ([TRANSACTION_TYPES.ADJUSTMENT, TRANSACTION_TYPES.PENALTY].includes(transaction_type)) {
        await safeQuery(
          'UPDATE financial_transactions SET status = $1, processed_by = $2, processed_at = NOW() WHERE id = $3',
          [TRANSACTION_STATUS.COMPLETED, req.user.id, newTransaction.id]
        );
        
        newTransaction.status = TRANSACTION_STATUS.COMPLETED;
        newTransaction.processed_by = req.user.id;
        newTransaction.processed_at = new Date();
      }

      // Notify user about transaction
      if (createNotification) {
        await createNotification({
          userId: user_id,
          type: 'financial_transaction',
          title: 'Finansal İşlem',
          message: `${parseFloat(amount).toLocaleString('tr-TR')}₺ ${transaction_type} işlemi oluşturuldu.`,
          metadata: { 
            transactionId: newTransaction.id,
            transactionRef,
            amount: parseFloat(amount),
            transactionType: transaction_type
          }
        });
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'FINANCIAL_TRANSACTION_CREATED',
          entity: 'financial_transaction',
          entityId: newTransaction.id,
          req,
          metadata: {
            transactionRef,
            amount: parseFloat(amount),
            transactionType: transaction_type,
            targetUserId: user_id
          }
        });
      }

      return res.status(201).json({
        success: true,
        data: newTransaction,
        message: 'Transaction created successfully'
      });

    } catch (error) {
      console.error('Create financial transaction error:', error);
      return res.status(500).json({
        success: false,
        message: 'Transaction creation failed',
        error: error.message
      });
    }
  });

  // PUT /api/financial/transactions/:id/process - Process pending transaction
  router.put('/transactions/:id/process', async (req, res) => {
    try {
      const transactionId = req.params.id;
      const { action, notes } = req.body; // action: 'approve' | 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be approve or reject'
        });
      }

      // Get transaction details
      const transactionQuery = await safeQuery(
        'SELECT * FROM financial_transactions WHERE id = $1',
        [transactionId]
      );

      if (transactionQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const transaction = transactionQuery.rows[0];

      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: 'Only pending transactions can be processed'
        });
      }

      const newStatus = action === 'approve' ? TRANSACTION_STATUS.COMPLETED : TRANSACTION_STATUS.CANCELLED;
      const processedAt = new Date();

      // Update transaction
      const updateResult = await safeQuery(`
        UPDATE financial_transactions 
        SET status = $1, processed_by = $2, processed_at = $3, processing_notes = $4
        WHERE id = $5
        RETURNING *
      `, [newStatus, req.user.id, processedAt, notes || null, transactionId]);

      const updatedTransaction = updateResult.rows[0];

      // Update user balance if applicable
      if (action === 'approve' && [TRANSACTION_TYPES.PAYOUT, TRANSACTION_TYPES.BONUS].includes(transaction.transaction_type)) {
        await safeQuery(
          'UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2',
          [transaction.amount, transaction.user_id]
        );
      }

      // Notify user
      if (createNotification) {
        const notificationTitle = action === 'approve' ? 'İşlem Onaylandı' : 'İşlem Reddedildi';
        const notificationMessage = `${transaction.amount.toLocaleString('tr-TR')}₺ ${transaction.transaction_type} işleminiz ${action === 'approve' ? 'onaylanmıştır' : 'reddedilmiştir'}.`;

        await createNotification({
          userId: transaction.user_id,
          type: 'transaction_processed',
          title: notificationTitle,
          message: notificationMessage,
          metadata: { 
            transactionId: transaction.id,
            transactionRef: transaction.reference_id,
            amount: transaction.amount,
            action: action
          }
        });
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'FINANCIAL_TRANSACTION_PROCESSED',
          entity: 'financial_transaction',
          entityId: transactionId,
          req,
          metadata: {
            action: action,
            amount: transaction.amount,
            transactionType: transaction.transaction_type,
            notes: notes
          }
        });
      }

      return res.json({
        success: true,
        data: updatedTransaction,
        message: `Transaction ${action}ed successfully`
      });

    } catch (error) {
      console.error('Process financial transaction error:', error);
      return res.status(500).json({
        success: false,
        message: 'Transaction processing failed',
        error: error.message
      });
    }
  });

  // GET /api/financial/reconciliation - Financial reconciliation report
  router.get('/reconciliation', async (req, res) => {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;

      // Daily transaction summary
      const dailySummary = await safeQuery(`
        SELECT 
          transaction_type,
          status,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM financial_transactions 
        WHERE DATE(created_at) = $1
        GROUP BY transaction_type, status
        ORDER BY transaction_type, status
      `, [date]);

      // Platform balance calculation
      const balanceCalculation = await safeQuery(`
        SELECT 
          SUM(CASE 
            WHEN transaction_type IN ('commission', 'penalty') AND status = 'completed' THEN amount
            WHEN transaction_type IN ('payout', 'refund', 'bonus') AND status = 'completed' THEN -amount
            ELSE 0
          END) as calculated_balance,
          SUM(CASE WHEN transaction_type = 'escrow_hold' AND status = 'completed' THEN amount ELSE 0 END) -
          SUM(CASE WHEN transaction_type = 'escrow_release' AND status = 'completed' THEN amount ELSE 0 END) as escrow_balance
        FROM financial_transactions
        WHERE created_at <= $1 || ' 23:59:59'
      `, [date]);

      // User balances verification
      const userBalances = await safeQuery(`
        SELECT 
          COUNT(CASE WHEN balance < 0 THEN 1 END) as negative_balance_count,
          SUM(COALESCE(balance, 0)) as total_user_balances,
          AVG(COALESCE(balance, 0)) as avg_user_balance
        FROM users
      `);

      // Pending transactions requiring attention
      const pendingTransactions = await safeQuery(`
        SELECT 
          transaction_type,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          MIN(created_at) as oldest_pending
        FROM financial_transactions 
        WHERE status = 'pending'
        GROUP BY transaction_type
        ORDER BY oldest_pending ASC
      `);

      // Discrepancies check
      const discrepancies = [];
      
      // Check for transactions without proper references
      const orphanTransactions = await safeQuery(`
        SELECT COUNT(*) as count
        FROM financial_transactions 
        WHERE reference_id IS NULL OR reference_id = ''
        AND created_at >= $1
        AND created_at < $1::date + INTERVAL '1 day'
      `, [date]);

      if (parseInt(orphanTransactions.rows[0]?.count || 0) > 0) {
        discrepancies.push({
          type: 'missing_references',
          count: orphanTransactions.rows[0].count,
          description: 'Transactions without proper reference IDs'
        });
      }

      // Check for failed transactions that need review
      const failedTransactions = await safeQuery(`
        SELECT COUNT(*) as count
        FROM financial_transactions 
        WHERE status = 'failed'
        AND created_at >= $1
        AND created_at < $1::date + INTERVAL '1 day'
      `, [date]);

      if (parseInt(failedTransactions.rows[0]?.count || 0) > 0) {
        discrepancies.push({
          type: 'failed_transactions',
          count: failedTransactions.rows[0].count,
          description: 'Failed transactions requiring investigation'
        });
      }

      const reconciliation = {
        date: date,
        dailySummary: dailySummary.rows,
        balanceCalculation: balanceCalculation.rows[0] || {},
        userBalances: userBalances.rows[0] || {},
        pendingTransactions: pendingTransactions.rows,
        discrepancies: discrepancies,
        reconciled_at: new Date(),
        reconciled_by: req.user.id
      };

      // Log reconciliation
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'FINANCIAL_RECONCILIATION',
          entity: 'financial_system',
          entityId: date,
          req,
          metadata: {
            date: date,
            discrepanciesCount: discrepancies.length,
            pendingTransactionsCount: pendingTransactions.rows.length
          }
        });
      }

      return res.json({
        success: true,
        data: reconciliation
      });

    } catch (error) {
      console.error('Financial reconciliation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Reconciliation failed',
        error: error.message
      });
    }
  });

  // GET /api/financial/commission-calculator - Calculate commission for amount and user type
  router.get('/commission-calculator', async (req, res) => {
    try {
      const { amount, user_type = 'individual' } = req.query;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      const baseAmount = parseFloat(amount);
      const commission = calculateCommission(baseAmount, user_type);
      const netAmount = baseAmount - commission;
      const commissionRate = COMMISSION_RATES[user_type] || COMMISSION_RATES.individual;

      return res.json({
        success: true,
        data: {
          baseAmount: baseAmount,
          commissionRate: commissionRate,
          commissionAmount: commission,
          netAmount: netAmount,
          userType: user_type,
          calculatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Commission calculation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Commission calculation failed',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createFinancialTransparencyRoutes;
