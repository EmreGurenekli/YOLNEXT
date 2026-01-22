const express = require('express');
const paymentService = require('../../services/paymentService');
const paymentSecurityService = require('../../services/paymentSecurityService');

function createWalletRoutes(pool, authenticateToken) {
  const router = express.Router();

  const round2 = (n) => {
    const x = typeof n === 'number' ? n : parseFloat(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
  };

  const ensureWalletSchema = async (client) => {
    await client.query(
      `CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        balance DECIMAL(12,2) DEFAULT 0,
        reserved_balance DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(64) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(32) DEFAULT 'pending',
        description TEXT,
        reference_type VARCHAR(64),
        reference_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id)');
    } catch (_) {
      // ignore
    }
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    } catch (_) {
      // ignore
    }
  };

  const ensureTopupSchema = async (client) => {
    // Safety net: avoid runtime errors if migrations were not applied yet.
    await client.query(
      `CREATE TABLE IF NOT EXISTS topup_intents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        provider VARCHAR(32) NOT NULL,
        provider_intent_id VARCHAR(128) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(8) DEFAULT 'TRY',
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        risk_decision VARCHAR(32) DEFAULT 'allow',
        risk_reason TEXT,
        ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP
      )`
    );
    try {
      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_provider_intent
         ON topup_intents(provider, provider_intent_id)`
      );
    } catch (_) {
      // ignore
    }
    try {
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_topup_user_created
         ON topup_intents(user_id, created_at)`
      );
    } catch (_) {
      // ignore
    }
  };

  const ensureWalletRow = async (client, userId) => {
    try {
      await client.query(
        'INSERT INTO wallets (user_id, balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      );
      return true;
    } catch (e1) {
      try {
        await client.query(
          'INSERT INTO wallets (userid, balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT (userid) DO NOTHING',
          [userId]
        );
        return true;
      } catch (e2) {
        try {
          await client.query(
            'INSERT INTO wallets ("userId", balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT ("userId") DO NOTHING',
            [userId]
          );
          return true;
        } catch (_) {
          return false;
        }
      }
    }
  };

  const getWalletForUpdate = async (client, userId, forUpdate) => {
    const suffix = forUpdate ? ' FOR UPDATE' : '';
    try {
      return await client.query(`SELECT balance, reserved_balance FROM wallets WHERE user_id = $1${suffix}`, [userId]);
    } catch (e1) {
      try {
        return await client.query(`SELECT balance, reserved_balance FROM wallets WHERE userid = $1${suffix}`, [userId]);
      } catch (e2) {
        return await client.query(`SELECT balance, reserved_balance FROM wallets WHERE "userId" = $1${suffix}`, [userId]);
      }
    }
  };

  router.get('/balance', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await ensureWalletSchema(client);
        await ensureTopupSchema(client);
        await ensureWalletRow(client, userId);
        const w = await getWalletForUpdate(client, userId, false);
        await client.query('COMMIT');

        const row = w.rows && w.rows[0] ? w.rows[0] : { balance: 0, reserved_balance: 0 };
        return res.json({
          success: true,
          data: {
            balance: round2(row.balance),
            reservedBalance: round2(row.reserved_balance),
            availableBalance: round2(round2(row.balance) - round2(row.reserved_balance)),
          },
        });

      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Cüzdan bakiyesi alınamadı' });
    }
  });

  const checkTopupRisk = async (client, userId, amount, req) => {
    await ensureTopupSchema(client);
    const amountCheck = paymentSecurityService.validatePaymentAmount(amount, {
      minAmount: 1,
      maxAmount: 50000,
      allowedDecimals: 2,
    });
    if (!amountCheck.valid) {
      return { decision: 'block', reason: amountCheck.reason || 'invalid_amount' };
    }

    // Velocity: max 5 top-up intents in last 15 minutes
    const recent = await client.query(
      `SELECT COUNT(*)::int AS c
       FROM topup_intents
       WHERE user_id = $1
         AND created_at > (CURRENT_TIMESTAMP - INTERVAL '15 minutes')`,
      [userId]
    );
    const c = recent.rows?.[0]?.c ?? 0;
    if (Number(c) >= 5) {
      return { decision: 'block', reason: 'rate_limited' };
    }

    // Daily total cap: 200k TRY in last 24h
    const daily = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM topup_intents
       WHERE user_id = $1
         AND status IN ('pending','succeeded')
         AND created_at > (CURRENT_TIMESTAMP - INTERVAL '24 hours')`,
      [userId]
    );
    const total = parseFloat(daily.rows?.[0]?.total ?? '0');
    if (Number.isFinite(total) && total + amount > 200000) {
      return { decision: 'review', reason: 'daily_limit' };
    }

    // Basic IP/user-agent capture for audit
    return {
      decision: 'allow',
      reason: null,
      ip: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
    };
  };

  // Create top-up intent (production-safe: does NOT credit wallet)
  router.post('/topup/intent', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const amount = round2(req.body?.amount);
      if (!(amount > 0)) {
        return res.status(400).json({ success: false, message: 'Geçersiz miktar' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Risk decision
        const risk = await checkTopupRisk(client, userId, amount, req);
        if (risk.decision === 'block') {
          await client.query('ROLLBACK');
          return res.status(403).json({ success: false, message: 'İşlem güvenlik nedeniyle engellendi', reason: risk.reason });
        }

        // Ensure wallet exists (for later credit)
        await ensureWalletRow(client, userId);

        // Create provider intent
        let provider = 'stripe';
        let providerIntentId = null;
        let clientSecret = null;
        let providerStatus = 'pending';

        const NODE_ENV = process.env.NODE_ENV || 'development';
        const useMock = NODE_ENV !== 'production' || !process.env.STRIPE_SECRET_KEY;
        const metadata = { userId: String(userId), type: 'wallet_topup', amount: String(amount) };

        if (useMock) {
          provider = 'mock';
          const mock = await paymentService.createMockPayment(amount, metadata);
          providerIntentId = mock.paymentIntentId;
          clientSecret = mock.clientSecret;
          providerStatus = 'pending';
        } else {
          const pi = await paymentService.createPaymentIntent(amount, 'try', metadata);
          if (!pi.success) {
            await client.query('ROLLBACK');
            return res.status(500).json({ success: false, message: 'Ödeme başlatılamadı' });
          }
          providerIntentId = pi.paymentIntentId;
          clientSecret = pi.clientSecret;
        }

        await client.query(
          `INSERT INTO topup_intents (user_id, provider, provider_intent_id, amount, currency, status, risk_decision, risk_reason, ip, user_agent)
           VALUES ($1,$2,$3,$4,'TRY',$5,$6,$7,$8,$9)
           ON CONFLICT (provider, provider_intent_id) DO NOTHING`,
          [userId, provider, providerIntentId, amount, providerStatus, risk.decision, risk.reason, risk.ip || null, risk.userAgent || null]
        );

        await client.query('COMMIT');
        return res.json({
          success: true,
          data: {
            provider,
            providerIntentId,
            clientSecret,
            amount,
            riskDecision: risk.decision,
          },
        });
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Top-up başlatılamadı' });
    }
  });

  // Confirm top-up (credits wallet once)
  router.post('/topup/confirm', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const providerIntentId = String(req.body?.providerIntentId || '').trim();
      if (!providerIntentId) {
        return res.status(400).json({ success: false, message: 'providerIntentId gerekli' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const intentRes = await client.query(
          `SELECT id, user_id, provider, provider_intent_id, amount, status, risk_decision
           FROM topup_intents
           WHERE provider_intent_id = $1
           FOR UPDATE`,
          [providerIntentId]
        );

        if (!intentRes.rows || intentRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, message: 'Top-up intent bulunamadı' });
        }

        const intent = intentRes.rows[0];
        if (String(intent.user_id) !== String(userId)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ success: false, message: 'Bu intent için yetkiniz yok' });
        }

        if (intent.risk_decision === 'block') {
          await client.query('ROLLBACK');
          return res.status(403).json({ success: false, message: 'İşlem güvenlik nedeniyle engellendi' });
        }

        // Idempotent: if already succeeded, just return ok
        if (intent.status === 'succeeded') {
          await client.query('COMMIT');
          return res.json({ success: true, data: { amount: round2(intent.amount), status: 'succeeded' } });
        }

        // Provider confirmation
        let confirmed = { success: false, status: 'failed', amount: 0 };
        if (intent.provider === 'mock') {
          // In dev/test we treat mock as succeeded
          confirmed = { success: true, status: 'succeeded', amount: round2(intent.amount) };
        } else {
          confirmed = await paymentService.confirmPayment(intent.provider_intent_id);
        }

        if (!confirmed.success || confirmed.status !== 'succeeded') {
          await client.query(
            `UPDATE topup_intents SET status = 'failed' WHERE id = $1`,
            [intent.id]
          );
          await client.query('COMMIT');
          return res.status(402).json({ success: false, message: 'Ödeme tamamlanmadı' });
        }

        // Credit wallet
        await ensureWalletRow(client, userId);
        await client.query(
          'UPDATE wallets SET balance = COALESCE(balance,0) + $1 WHERE user_id = $2',
          [round2(intent.amount), userId]
        ).catch(async () => {
          await client.query('UPDATE wallets SET balance = COALESCE(balance,0) + $1 WHERE userid = $2', [round2(intent.amount), userId]).catch(async () => {
            await client.query('UPDATE wallets SET balance = COALESCE(balance,0) + $1 WHERE "userId" = $2', [round2(intent.amount), userId]);
          });
        });

        await client.query(
          `UPDATE topup_intents
           SET status = 'succeeded', confirmed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [intent.id]
        );

        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
           VALUES ($1, 'deposit', $2, 'completed', $3, 'topup', $4)
           ON CONFLICT DO NOTHING`,
          [userId, round2(intent.amount), 'Cüzdan yükleme', providerIntentId]
        );

        await client.query('COMMIT');
        return res.json({ success: true, data: { amount: round2(intent.amount), status: 'succeeded' } });
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Top-up onayı başarısız' });
    }
  });

  router.get('/nakliyeci', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await ensureWalletSchema(client);
        await ensureWalletRow(client, userId);
        const w = await getWalletForUpdate(client, userId, false);

        const walletRow = w.rows && w.rows[0] ? w.rows[0] : { balance: 0, reserved_balance: 0 };
        const balance = round2(walletRow.balance);
        const reserved = round2(walletRow.reserved_balance);

        const totalsRes = await client.query(
          `SELECT
             COALESCE(SUM(CASE WHEN type = 'commission_capture' THEN amount ELSE 0 END), 0) AS total_commissions,
             COALESCE(SUM(CASE WHEN type = 'commission_release' THEN amount ELSE 0 END), 0) AS total_releases
           FROM transactions
           WHERE user_id = $1`,
          [userId]
        );

        const totals = totalsRes.rows && totalsRes.rows[0] ? totalsRes.rows[0] : {};

        const tCols = await client.query(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_name = 'transactions' AND table_schema = 'public'`
        );
        const tSet = new Set((tCols.rows || []).map(r => r.column_name));
        const pickT = (...names) => names.find(n => tSet.has(n)) || null;
        const tCreated = pickT('createdAt', 'created_at', 'createdat');
        const qT = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
        const createdExpr = tCreated ? `${qT(tCreated)}` : null;

        const txRes = await client.query(
          `SELECT id, reference_id as "offerId", description, amount, type, status, ${createdExpr ? `${createdExpr}` : 'NULL'} as "createdAt"
           FROM transactions
           WHERE user_id = $1
           AND reference_type = 'offer'
           ORDER BY id DESC
           LIMIT 50`,
          [userId]
        );

        await client.query('COMMIT');

        const transactions = (txRes.rows || []).map(r => ({
          id: r.id,
          offerId: r.offerId ? Number(r.offerId) : null,
          shipmentTitle: r.description || 'Komisyon',
          amount: round2(r.amount),
          status: r.status === 'completed' ? 'completed' : 'pending',
          createdAt: r.createdAt,
        }));

        return res.json({
          success: true,
          data: {
            balance,
            reservedBalance: reserved,
            pendingCommissions: reserved,
            totalCommissions: round2(totals.total_commissions),
            totalRefunds: round2(totals.total_releases),
            commissionRate: 1,
            transactions,
          },
        });
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Cüzdan verileri yüklenemedi' });
    }
  });

  // Backward-compatible (dev/test only) deposit endpoint.
  router.post('/deposit', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const amount = round2(req.body?.amount);
      if (!(amount > 0)) {
        return res.status(400).json({ success: false, message: 'Geçersiz miktar' });
      }

      const NODE_ENV = process.env.NODE_ENV || 'development';
      if (NODE_ENV === 'production') {
        return res.status(400).json({
          success: false,
          message: 'Ödeme doğrulaması olmadan bakiye yüklenemez. Top-up intent akışı kullanılmalı.',
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await ensureWalletRow(client, userId);

        await client.query(
          'UPDATE wallets SET balance = COALESCE(balance,0) + $1 WHERE user_id = $2',
          [amount, userId]
        ).catch(async () => {
          await client.query('UPDATE wallets SET balance = COALESCE(balance,0) + $1 WHERE userid = $2', [amount, userId]).catch(async () => {
            await client.query('UPDATE wallets SET balance = COALESCE(balance,0) + $1 WHERE "userId" = $2', [amount, userId]);
          });
        });

        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
           VALUES ($1, 'deposit', $2, 'completed', $3, 'topup', $4)`,
          [userId, amount, 'Cüzdan yükleme', String(Date.now())]
        );

        await client.query('COMMIT');
        return res.json({ success: true, data: { amount } });
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Para yatırma işlemi başarısız' });
    }
  });

  return router;
}

module.exports = createWalletRoutes;
