const { Pool } = require('pg');

class WalletService {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'YolNext_kargo',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });
  }

  // Cüzdan oluşturma
  async createWallet(userId) {
    try {
      const result = await this.pool.query(`
        INSERT INTO user_wallets (user_id, balance, currency, is_active)
        VALUES ($1, 0.00, 'TRY', true)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING *
      `, [userId]);

      return { success: true, wallet: result.rows[0] };
    } catch (error) {
      console.error('Cüzdan oluşturma hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Cüzdan bakiyesi getirme
  async getBalance(userId) {
    try {
      const result = await this.pool.query(`
        SELECT balance, currency, updated_at
        FROM user_wallets
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      if (result.rows.length === 0) {
        // Cüzdan yoksa oluştur
        const createResult = await this.createWallet(userId);
        if (createResult.success) {
          return { success: true, balance: 0, currency: 'TRY' };
        }
        return { success: false, error: 'Cüzdan oluşturulamadı' };
      }

      return { 
        success: true, 
        balance: result.rows[0].balance,
        currency: result.rows[0].currency,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error('Bakiye getirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Para yatırma
  async deposit(userId, amount, description = 'Para yatırma') {
    try {
      await this.pool.query('BEGIN');

      // Bakiye güncelle
      const updateResult = await this.pool.query(`
        UPDATE user_wallets 
        SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND is_active = true
        RETURNING balance
      `, [amount, userId]);

      if (updateResult.rows.length === 0) {
        await this.pool.query('ROLLBACK');
        return { success: false, error: 'Cüzdan bulunamadı' };
      }

      // İşlem kaydı oluştur
      await this.pool.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
        VALUES ($1, 'deposit', $2, $3, $4)
      `, [userId, amount, updateResult.rows[0].balance, description]);

      await this.pool.query('COMMIT');

      return { 
        success: true, 
        newBalance: updateResult.rows[0].balance,
        amount: amount
      };
    } catch (error) {
      await this.pool.query('ROLLBACK');
      console.error('Para yatırma hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Para çekme
  async withdraw(userId, amount, description = 'Para çekme') {
    try {
      await this.pool.query('BEGIN');

      // Mevcut bakiye kontrolü
      const balanceResult = await this.pool.query(`
        SELECT balance FROM user_wallets
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      if (balanceResult.rows.length === 0) {
        await this.pool.query('ROLLBACK');
        return { success: false, error: 'Cüzdan bulunamadı' };
      }

      const currentBalance = parseFloat(balanceResult.rows[0].balance);
      if (currentBalance < amount) {
        await this.pool.query('ROLLBACK');
        return { success: false, error: 'Yetersiz bakiye' };
      }

      // Bakiye güncelle
      const updateResult = await this.pool.query(`
        UPDATE user_wallets 
        SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND is_active = true
        RETURNING balance
      `, [amount, userId]);

      // İşlem kaydı oluştur
      await this.pool.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
        VALUES ($1, 'withdraw', $2, $3, $4)
      `, [userId, amount, updateResult.rows[0].balance, description]);

      await this.pool.query('COMMIT');

      return { 
        success: true, 
        newBalance: updateResult.rows[0].balance,
        amount: amount
      };
    } catch (error) {
      await this.pool.query('ROLLBACK');
      console.error('Para çekme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // İşlem geçmişi
  async getTransactionHistory(userId, limit = 50, offset = 0) {
    try {
      const result = await this.pool.query(`
        SELECT id, type, amount, balance_after, description, created_at
        FROM wallet_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return { success: true, transactions: result.rows };
    } catch (error) {
      console.error('İşlem geçmişi hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Komisyon hesaplama
  calculateCommission(amount, rate = 0.01) {
    return Math.round(amount * rate * 100) / 100; // 2 ondalık basamak
  }

  // Komisyon ödeme
  async payCommission(nakliyeciId, amount, shipmentId) {
    const commission = this.calculateCommission(amount);
    
    try {
      await this.pool.query('BEGIN');

      // Nakliyeci cüzdanına komisyon ekle
      const depositResult = await this.deposit(
        nakliyeciId, 
        commission, 
        `Komisyon - Gönderi #${shipmentId}`
      );

      if (!depositResult.success) {
        await this.pool.query('ROLLBACK');
        return depositResult;
      }

      // Komisyon kaydı oluştur
      await this.pool.query(`
        INSERT INTO commission_transactions (nakliyeci_id, shipment_id, amount, commission_rate, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [nakliyeciId, shipmentId, commission, 0.01]);

      await this.pool.query('COMMIT');

      return { 
        success: true, 
        commission: commission,
        newBalance: depositResult.newBalance
      };
    } catch (error) {
      await this.pool.query('ROLLBACK');
      console.error('Komisyon ödeme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WalletService();


