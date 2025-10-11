const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 1. Kullanıcı kaydı
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, panel_type, company_name, location } = req.body;

    // Validasyon
    if (!name || !email || !password || !panel_type) {
      return res.status(400).json({
        success: false,
        message: 'Ad, e-posta, şifre ve panel tipi gerekli'
      });
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir e-posta adresi girin'
      });
    }

    // Şifre güçlülük kontrolü
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalı'
      });
    }

    // E-posta benzersizlik kontrolü
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        console.error('E-posta kontrolü hatası:', err);
        return res.status(500).json({
          success: false,
          message: 'Sunucu hatası'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu e-posta adresi zaten kullanılıyor'
        });
      }

      // Şifreyi hashle
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Kullanıcıyı oluştur
      const sql = `INSERT INTO users (name, email, password, panel_type, company_name, location, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const now = new Date().toISOString();

      db.run(sql, [name, email, hashedPassword, panel_type, company_name || null, location || null, now, now], function(err) {
        if (err) {
          console.error('Kullanıcı oluşturma hatası:', err);
          return res.status(500).json({
            success: false,
            message: 'Kullanıcı oluşturulamadı'
          });
        }

        const userId = this.lastID;

        // Cüzdan oluştur
        db.run(
          'INSERT INTO wallets (user_id, balance, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [userId, 0, 'TRY', now, now],
          (err) => {
            if (err) {
              console.error('Cüzdan oluşturma hatası:', err);
            }
          }
        );

        // Nakliyeci veya taşıyıcı ise carrier tablosuna ekle
        if (panel_type === 'nakliyeci' || panel_type === 'tasiyici') {
          db.run(
            'INSERT INTO carriers (user_id, company_name, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [userId, company_name || null, true, now, now],
            (err) => {
              if (err) {
                console.error('Carrier oluşturma hatası:', err);
              }
            }
          );
        }

        // JWT token oluştur
        const token = jwt.sign(
          { 
            id: userId, 
            email, 
            panel_type,
            name 
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
          success: true,
          data: {
            user: {
              id: userId,
              name,
              email,
              panel_type,
              company_name: company_name || null,
              location: location || null
            },
            token
          }
        });
      });
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 2. Kullanıcı girişi
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gerekli'
      });
    }

    // Kullanıcıyı bul
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('Giriş hatası:', err);
        return res.status(500).json({
          success: false,
          message: 'Sunucu hatası'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz e-posta veya şifre'
        });
      }

      // Şifre kontrolü
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz e-posta veya şifre'
        });
      }

      // JWT token oluştur
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          panel_type: user.panel_type,
          name: user.name 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Güvenlik logu
      db.run(
        'INSERT INTO security_logs (user_id, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'login', req.ip, req.get('User-Agent'), new Date().toISOString()],
        (err) => {
          if (err) {
            console.error('Güvenlik logu hatası:', err);
          }
        }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            panel_type: user.panel_type,
            company_name: user.company_name,
            location: user.location,
            is_verified: user.is_verified
          },
          token
        }
      });
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 3. Token doğrulama
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token gerekli'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Geçersiz token'
        });
      }

      // Kullanıcı bilgilerini getir
      db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Kullanıcı bulunamadı'
          });
        }

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              panel_type: user.panel_type,
              company_name: user.company_name,
              location: user.location,
              is_verified: user.is_verified
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 4. Şifre değiştirme
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { currentPassword, newPassword } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token gerekli'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre ve yeni şifre gerekli'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalı'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Geçersiz token'
        });
      }

      // Mevcut şifreyi kontrol et
      db.get('SELECT password FROM users WHERE id = ?', [decoded.id], (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
          });
        }

        if (!bcrypt.compareSync(currentPassword, user.password)) {
          return res.status(400).json({
            success: false,
            message: 'Mevcut şifre yanlış'
          });
        }

        // Yeni şifreyi hashle ve güncelle
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
        const now = new Date().toISOString();

        db.run(
          'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
          [hashedNewPassword, now, decoded.id],
          (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Şifre güncellenemedi'
              });
            }

            // Güvenlik logu
            db.run(
              'INSERT INTO security_logs (user_id, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?)',
              [decoded.id, 'password_change', req.ip, req.get('User-Agent'), now],
              (err) => {
                if (err) {
                  console.error('Güvenlik logu hatası:', err);
                }
              }
            );

            res.json({
              success: true,
              message: 'Şifre başarıyla güncellendi'
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 5. Çıkış yapma
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
          // Güvenlik logu
          db.run(
            'INSERT INTO security_logs (user_id, action, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?)',
            [decoded.id, 'logout', req.ip, req.get('User-Agent'), new Date().toISOString()],
            (err) => {
              if (err) {
                console.error('Güvenlik logu hatası:', err);
              }
            }
          );
        }
      });
    }

    res.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;





