// Simple User model for SQLite/PostgreSQL compatibility
class SimpleUser {
  constructor(db) {
    this.db = db;
  }

  async create(userData) {
    const { firstName, lastName, email, password, userType, phone, companyName } = userData;
    const id = require('uuid').v4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO users (id, first_name, last_name, email, password, user_type, phone, company_name, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [id, firstName, lastName, email, password, userType, phone, companyName, now, now];
    
    await this.db.query(sql, params);
    
    return {
      id,
      firstName,
      lastName,
      email,
      userType,
      phone,
      companyName,
      createdAt: now,
      updatedAt: now
    };
  }

  async findOne(where) {
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    
    const sql = `SELECT * FROM users WHERE ${conditions} LIMIT 1`;
    const result = await this.db.query(sql, values);
    
    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        password: user.password,
        userType: user.user_type,
        phone: user.phone,
        companyName: user.company_name,
        isVerified: user.is_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    }
    
    return null;
  }

  async findByPk(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    
    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        password: user.password,
        userType: user.user_type,
        phone: user.phone,
        companyName: user.company_name,
        isVerified: user.is_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    }
    
    return null;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), new Date().toISOString(), id];
    
    const sql = `UPDATE users SET ${fields}, updated_at = ? WHERE id = ?`;
    await this.db.query(sql, values);
    
    return this.findByPk(id);
  }

  async destroy(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await this.db.query(sql, [id]);
    return true;
  }
}

module.exports = SimpleUser;


