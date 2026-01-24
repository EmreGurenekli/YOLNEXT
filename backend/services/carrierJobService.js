/**
 * Job Service - Centralized job scheduler
 * Handles all scheduled tasks (cleanup, automated jobs, etc.)
 * 
 * This service consolidates all setInterval jobs to prevent duplication
 * and improve maintainability.
 */

const errorLogger = require('../utils/errorLogger');

class JobService {
  constructor(pool, NODE_ENV) {
    this.pool = pool;
    this.NODE_ENV = NODE_ENV;
    this.jobs = [];
    this.jobInterval = null;
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.warn('⚠️ JobService is already running');
      return;
    }

    this.isRunning = true;
    console.log('✅ JobService started');

    // Data retention cleanup job (runs daily)
    this.startRetentionCleanup();

    // Automated job system (runs every hour)
    this.startAutomatedJobs();

    return this.jobs;
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach(job => {
      if (job) clearInterval(job);
    });
    if (this.jobInterval) {
      clearInterval(this.jobInterval);
      this.jobInterval = null;
    }
    this.jobs = [];
    this.isRunning = false;
    console.log('🛑 JobService stopped');
  }

  /**
   * Data retention cleanup job - runs daily
   */
  startRetentionCleanup() {
    const job = setInterval(
      async () => {
        try {
          if (!this.pool) return;
          
          const retentionDays = {
            messages: parseInt(process.env.RETENTION_MESSAGES_DAYS) || 365, // 1 year
            notifications: parseInt(process.env.RETENTION_NOTIFICATIONS_DAYS) || 90, // 3 months
            audit_logs: parseInt(process.env.RETENTION_AUDIT_DAYS) || 730, // 2 years
          };

          // Cleanup old messages (from completed/cancelled shipments)
          const messagesCutoff = new Date();
          messagesCutoff.setDate(messagesCutoff.getDate() - retentionDays.messages);
          const msgResult = await this.pool.query(
            `DELETE FROM messages 
             WHERE createdAt < $1 
             AND shipmentId IN (SELECT id FROM shipments WHERE status IN ('delivered', 'cancelled'))`,
            [messagesCutoff]
          );

          // Cleanup old read notifications
          const notifCutoff = new Date();
          notifCutoff.setDate(notifCutoff.getDate() - retentionDays.notifications);
          const notifResult = await this.pool.query(
            `DELETE FROM notifications WHERE createdAt < $1 AND isRead = true`,
            [notifCutoff]
          );

          // Cleanup old audit logs
          const auditCutoff = new Date();
          auditCutoff.setDate(auditCutoff.getDate() - retentionDays.audit_logs);
          const auditResult = await this.pool.query(
            `DELETE FROM audit_logs WHERE createdAt < $1`,
            [auditCutoff]
          );

          if (this.NODE_ENV === 'development') {
            errorLogger.logInfo(
              `Retention cleanup: ${msgResult.rowCount} messages, ${notifResult.rowCount} notifications, ${auditResult.rowCount} audit logs`
            );
          }
        } catch (e) {
          errorLogger.logDatabaseError(e, 'retention_cleanup');
        }
      },
      24 * 60 * 60 * 1000 // Run every 24 hours
    );

    this.jobs.push(job);
    console.log('✅ Retention cleanup job scheduled (daily)');
  }

  /**
   * Automated job system - runs every hour
   */
  startAutomatedJobs() {
    // Store interval ID for cleanup
    if (this.jobInterval) {
      clearInterval(this.jobInterval);
    }
    this.jobInterval = setInterval(
      async () => {
        try {
          if (!this.pool) return;

          // 1. Clean up expired offers (runs every hour)
          const expiredClient = await this.pool.connect();
          let expiredOffersResult = { rowCount: 0 };
          try {
            await expiredClient.query('BEGIN');

            const expiredOffers = await expiredClient.query(
              `SELECT id, "nakliyeci_id" as carrier_id, price
               FROM offers
               WHERE status = 'pending'
               AND expiresAt IS NOT NULL
               AND expiresAt < CURRENT_TIMESTAMP
               FOR UPDATE`,
              []
            );

            expiredOffersResult = await expiredClient.query(
              `UPDATE offers
               SET status = 'rejected', updatedat = CURRENT_TIMESTAMP
               WHERE status = 'pending'
               AND expiresAt IS NOT NULL
               AND expiresAt < CURRENT_TIMESTAMP`,
              []
            );

            if (expiredOffers.rows && expiredOffers.rows.length > 0) {
              for (const o of expiredOffers.rows) {
                const carrierId = o.carrier_id;
                if (!carrierId) continue;
                const commission = Math.round(((parseFloat(o.price) || 0) * 0.01) * 100) / 100;
                if (!(commission > 0)) continue;

                let walletRes;
                try {
                  walletRes = await expiredClient.query(
                    'SELECT reserved_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
                    [carrierId]
                  );
                } catch (e1) {
                  try {
                    walletRes = await expiredClient.query(
                      'SELECT reserved_balance FROM wallets WHERE userid = $1 FOR UPDATE',
                      [carrierId]
                    );
                  } catch (e2) {
                    walletRes = await expiredClient.query(
                      'SELECT reserved_balance FROM wallets WHERE "userId" = $1 FOR UPDATE',
                      [carrierId]
                    );
                  }
                }

                if (!walletRes.rows || walletRes.rows.length === 0) continue;

                try {
                  await expiredClient.query(
                    'UPDATE wallets SET reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE user_id = $2',
                    [commission, carrierId]
                  );
                } catch (e1) {
                  try {
                    await expiredClient.query(
                      'UPDATE wallets SET reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE userid = $2',
                      [commission, carrierId]
                    );
                  } catch (e2) {
                    await expiredClient.query(
                      'UPDATE wallets SET reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE "userId" = $2',
                      [commission, carrierId]
                    );
                  }
                }

                await expiredClient.query(
                  `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
                   VALUES ($1, 'commission_release', $2, 'completed', $3, 'offer', $4)`,
                  [carrierId, commission, `Teklif #${o.id} için komisyon blokesi kaldırıldı`, o.id]
                );
              }
            }

            await expiredClient.query('COMMIT');
          } catch (e) {
            try {
              await expiredClient.query('ROLLBACK');
            } catch (_) {
              // ignore
            }
            throw e;
          } finally {
            expiredClient.release();
          }

          // Reduced logging to prevent Cursor slowdown
          if (expiredOffersResult.rowCount > 0 && this.NODE_ENV === 'development') {
            // Only log if significant cleanup occurred
            if (expiredOffersResult.rowCount > 10) {
              console.log(`✅ Cleaned up ${expiredOffersResult.rowCount} expired offers`);
            }
          }

          // 2. Check for shipments that were accepted but never picked up (timeout after 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const timeoutShipmentsResult = await this.pool.query(
            `SELECT id, "user_id" as userid, "nakliyeci_id" as carrierid, title, status, "updatedAt" as updatedat
             FROM shipments
             WHERE status IN ('offer_accepted', 'accepted', 'in_progress', 'assigned')
             AND "updatedAt" < $1
             LIMIT 100`,
            [sevenDaysAgo]
          );

          if (timeoutShipmentsResult.rows.length > 0) {
            // Update timeout shipments
            for (const shipment of timeoutShipmentsResult.rows) {
              try {
                await this.pool.query(
                  `UPDATE shipments 
                   SET status = 'cancelled', "updatedAt" = CURRENT_TIMESTAMP
                   WHERE id = $1`,
                  [shipment.id]
                );

                // Create notification for user
                await this.pool.query(
                  `INSERT INTO notifications ("user_id", type, title, message, "createdAt")
                   VALUES ($1, 'shipment_timeout', 'Gönderi İptal Edildi', 
                   'Gönderiniz 7 gün içinde teslim alınmadığı için otomatik olarak iptal edildi.', CURRENT_TIMESTAMP)`,
                  [shipment.userid]
                );

                if (this.NODE_ENV === 'development') {
                  console.log(`⚠️ Timeout shipment cancelled: ${shipment.id} - ${shipment.title}`);
                }
              } catch (err) {
                errorLogger.logDatabaseError(err, 'timeout_shipment_cleanup');
              }
            }
          }

          // 3. Check for overdue pickup dates (pickup date passed but not picked up)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const overduePickupResult = await this.pool.query(
            `SELECT id, "user_id", "nakliyeci_id", title, "pickupDate", status
             FROM shipments
             WHERE "pickupDate" < $1
             AND status IN ('offer_accepted', 'in_progress', 'assigned')
             AND "pickupDate" IS NOT NULL
             LIMIT 50`,
            [today]
          );

          if (overduePickupResult.rows.length > 0) {
            for (const shipment of overduePickupResult.rows) {
              try {
                // Check if notification already sent today
                const existingNotif = await this.pool.query(
                  `SELECT id FROM notifications 
                   WHERE "user_id" = $1 
                   AND type = 'pickup_overdue'
                   AND "createdAt"::date = CURRENT_DATE
                   LIMIT 1`,
                  [shipment.user_id]
                );

                if (existingNotif.rows.length === 0) {
                  // Notify shipment owner
                  await this.pool.query(
                    `INSERT INTO notifications ("user_id", type, title, message, "createdAt")
                     VALUES ($1, 'pickup_overdue', 'Yükleme Tarihi Geçti', 
                     'Gönderiniz "${shipment.title}" için yükleme tarihi geçti. Lütfen nakliyeci ile iletişime geçin.', CURRENT_TIMESTAMP)`,
                    [shipment.user_id]
                  );

                  // Notify nakliyeci
                  if (shipment.nakliyeci_id) {
                    await this.pool.query(
                      `INSERT INTO notifications ("user_id", type, title, message, "createdAt")
                       VALUES ($1, 'pickup_overdue', 'Yükleme Tarihi Geçti', 
                       'Gönderi "${shipment.title}" için yükleme tarihi geçti. Lütfen taşıyıcı atayın veya gönderici ile iletişime geçin.', CURRENT_TIMESTAMP)`,
                      [shipment.nakliyeci_id]
                    );
                  }
                }
              } catch (err) {
                errorLogger.logDatabaseError(err, 'pickup_overdue_notification');
              }
            }
          }

          // 4. Check for overdue delivery dates (delivery date passed but not delivered)
          const overdueDeliveryResult = await this.pool.query(
            `SELECT id, "user_id", "nakliyeci_id", "driver_id", title, "deliveryDate", status
             FROM shipments
             WHERE "deliveryDate" < $1
             AND status IN ('in_transit', 'picked_up', 'in_progress', 'assigned')
             AND "deliveryDate" IS NOT NULL
             LIMIT 50`,
            [today]
          );

          if (overdueDeliveryResult.rows.length > 0) {
            for (const shipment of overdueDeliveryResult.rows) {
              try {
                // Check if notification already sent today
                const existingNotif = await this.pool.query(
                  `SELECT id FROM notifications 
                   WHERE "user_id" = $1 
                   AND type = 'delivery_overdue'
                   AND "createdAt"::date = CURRENT_DATE
                   LIMIT 1`,
                  [shipment.user_id]
                );

                if (existingNotif.rows.length === 0) {
                  // Notify shipment owner
                  await this.pool.query(
                    `INSERT INTO notifications ("user_id", type, title, message, "createdAt")
                     VALUES ($1, 'delivery_overdue', 'Teslimat Tarihi Geçti', 
                     'Gönderiniz "${shipment.title}" için teslimat tarihi geçti. Lütfen taşıyıcı veya nakliyeci ile iletişime geçin.', CURRENT_TIMESTAMP)`,
                    [shipment.user_id]
                  );

                  // Notify nakliyeci
                  if (shipment.nakliyeci_id) {
                    await this.pool.query(
                      `INSERT INTO notifications ("user_id", type, title, message, "createdAt")
                       VALUES ($1, 'delivery_overdue', 'Teslimat Tarihi Geçti', 
                       'Gönderi "${shipment.title}" için teslimat tarihi geçti. Lütfen taşıyıcı ile iletişime geçin.', CURRENT_TIMESTAMP)`,
                      [shipment.nakliyeci_id]
                    );
                  }

                  // Notify driver if assigned
                  if (shipment.driver_id) {
                    await this.pool.query(
                      `INSERT INTO notifications ("user_id", type, title, message, "createdAt")
                       VALUES ($1, 'delivery_overdue', 'Teslimat Tarihi Geçti', 
                       'Gönderi "${shipment.title}" için teslimat tarihi geçti. Lütfen acil olarak teslimatı tamamlayın.', CURRENT_TIMESTAMP)`,
                      [shipment.driver_id]
                    );
                  }
                }
              } catch (err) {
                errorLogger.logDatabaseError(err, 'delivery_overdue_notification');
              }
            }
          }

          // 5. Check for shipments with no offers (notify sender after 24-48 hours)
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          const noOffersResult = await this.pool.query(
            `SELECT s.id, s."user_id", s.title, s."createdAt", s.status,
                    COUNT(o.id) as offer_count
             FROM shipments s
             LEFT JOIN offers o ON s.id = o."shipment_id"
             WHERE s.status = 'waiting_for_offers'
             AND s."createdAt" < $1
             AND s."createdAt" > $2
             GROUP BY s.id, s."user_id", s.title, s."createdAt", s.status
             HAVING COUNT(o.id) = 0
             LIMIT 50`,
            [oneDayAgo, twoDaysAgo]
          );

          if (noOffersResult.rows.length > 0) {
            for (const shipment of noOffersResult.rows) {
              try {
                // Check if notification already sent today for this shipment
                const existingNotif = await this.pool.query(
                  `SELECT id FROM notifications 
                   WHERE "user_id" = $1 
                   AND type = 'no_offers'
                   AND data->>'shipmentId' = $2::text
                   AND created_at::date = CURRENT_DATE
                   LIMIT 1`,
                  [shipment.user_id, shipment.id.toString()]
                );

                if (existingNotif.rows.length === 0) {
                  // Notify sender that no offers received
                  await this.pool.query(
                    `INSERT INTO notifications ("user_id", type, title, message, data, created_at)
                     VALUES ($1, 'no_offers', 'Teklif Alınamadı', 
                     'Gönderiniz "${shipment.title}" için henüz teklif alınamadı. Fiyat veya detayları gözden geçirmek ister misiniz?', 
                     $2::jsonb, CURRENT_TIMESTAMP)`,
                    [shipment.user_id, JSON.stringify({ shipmentId: shipment.id })]
                  );

                  if (this.NODE_ENV === 'development') {
                    console.log(`📢 No offers notification sent for shipment: ${shipment.id}`);
                  }
                }
              } catch (err) {
                errorLogger.logDatabaseError(err, 'no_offers_notification');
              }
            }
          }

          // 6. Check for shipments where all offers were rejected
          const allRejectedResult = await this.pool.query(
            `SELECT s.id, s."user_id", s.title, s."createdAt", s.status,
                    COUNT(o.id) as total_offers,
                    COUNT(CASE WHEN o.status = 'rejected' THEN 1 END) as rejected_offers
             FROM shipments s
             LEFT JOIN offers o ON s.id = o."shipment_id"
             WHERE s.status = 'waiting_for_offers'
             AND s."createdAt" > $1
             GROUP BY s.id, s."user_id", s.title, s."createdAt", s.status
             HAVING COUNT(o.id) > 0 AND COUNT(CASE WHEN o.status = 'rejected' THEN 1 END) = COUNT(o.id)
             LIMIT 50`,
            [twoDaysAgo]
          );

          if (allRejectedResult.rows.length > 0) {
            for (const shipment of allRejectedResult.rows) {
              try {
                // Check if notification already sent today for this shipment
                const existingNotif = await this.pool.query(
                  `SELECT id FROM notifications 
                   WHERE "user_id" = $1 
                   AND type = 'all_offers_rejected'
                   AND data->>'shipmentId' = $2::text
                   AND created_at::date = CURRENT_DATE
                   LIMIT 1`,
                  [shipment.user_id, shipment.id.toString()]
                );

                if (existingNotif.rows.length === 0) {
                  // Notify sender that all offers were rejected
                  await this.pool.query(
                    `INSERT INTO notifications ("user_id", type, title, message, data, created_at)
                     VALUES ($1, 'all_offers_rejected', 'Tüm Teklifler Reddedildi', 
                     'Gönderiniz "${shipment.title}" için aldığınız tüm teklifler reddedildi. Gönderiyi yeniden yayınlamak veya fiyatı gözden geçirmek ister misiniz?', 
                     $2::jsonb, CURRENT_TIMESTAMP)`,
                    [shipment.user_id, JSON.stringify({ shipmentId: shipment.id })]
                  );

                  if (this.NODE_ENV === 'development') {
                    console.log(`📢 All offers rejected notification sent for shipment: ${shipment.id}`);
                  }
                }
              } catch (err) {
                errorLogger.logDatabaseError(err, 'all_offers_rejected_notification');
              }
            }
          }

          // 7. Check for negative wallet balances and prevent new offers
          const negativeBalanceResult = await this.pool.query(
            `SELECT w.id, COALESCE(w."user_id", w.userid) as "user_id", w.balance, u."firstName", u."lastName", u."companyName"
             FROM wallets w
             INNER JOIN users u ON COALESCE(w."user_id", w.userid) = u.id
             WHERE w.balance < 0
             AND u.role = 'nakliyeci'
             LIMIT 50`
          );

          if (negativeBalanceResult.rows.length > 0) {
            for (const wallet of negativeBalanceResult.rows) {
              try {
                // Check if notification already sent today
                const existingNotif = await this.pool.query(
                  `SELECT id FROM notifications 
                   WHERE "user_id" = $1 
                   AND type = 'negative_balance'
                   AND created_at::date = CURRENT_DATE
                   LIMIT 1`,
                  [wallet.user_id]
                );

                if (existingNotif.rows.length === 0) {
                  // Notify nakliyeci about negative balance
                  const balanceText = parseFloat(wallet.balance || 0).toFixed(2);
                  const message = `Cüzdan bakiyeniz negatif. Yeni teklifler verebilmek için cüzdanınıza para yatırmanız gerekmektedir. Mevcut bakiye: ${balanceText} TL`;
                  await this.pool.query(
                    `INSERT INTO notifications ("user_id", type, title, message, created_at)
                     VALUES ($1, 'negative_balance', 'Negatif Cüzdan Bakiyesi', $2, CURRENT_TIMESTAMP)`,
                    [wallet.user_id, message]
                  );

                  if (this.NODE_ENV === 'development') {
                    console.log(`⚠️ Negative balance notification sent for user: ${wallet.user_id}`);
                  }
                }
              } catch (err) {
                errorLogger.logDatabaseError(err, 'negative_balance_notification');
              }
            }
          }

          // 8. Rating timeout - Auto-close ratings after 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          // This would require a ratings table with created_at - for now, just log
          // Future: Auto-close rating reminders after 30 days

        } catch (e) {
          errorLogger.logDatabaseError(e, 'automated_jobs');
        }
      },
      60 * 60 * 1000 // Run every hour
    );

    this.jobs.push(job);
    console.log('✅ Automated jobs scheduled (hourly)');
  }
}

module.exports = JobService;



















