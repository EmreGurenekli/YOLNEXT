const express = require('express');
const router = express.Router();
router.use(express.json());

// Database connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Database connection helper
const getDb = () => {
  return new sqlite3.Database(dbPath);
};

// Create reviews table if not exists
const initReviewsTable = () => {
  const db = getDb();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewedUserId INTEGER NOT NULL,
      reviewedUserType TEXT CHECK(reviewedUserType IN ('nakliyeci', 'tasiyici')),
      reviewerId INTEGER NOT NULL,
      reviewerType TEXT CHECK(reviewerType IN ('individual', 'corporate', 'nakliyeci')),
      jobId INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      isVerified BOOLEAN DEFAULT 0,
      helpful INTEGER DEFAULT 0,
      response TEXT,
      responseDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add reviewedUserId column if it doesn't exist (for backward compatibility)
    db.run(`ALTER TABLE reviews ADD COLUMN reviewedUserId INTEGER`, () => {});
    db.run(`ALTER TABLE reviews ADD COLUMN reviewedUserType TEXT`, () => {});
    
    // Migrate existing tasiyiciId to reviewedUserId
    db.run(`UPDATE reviews SET reviewedUserId = tasiyiciId, reviewedUserType = 'tasiyici' WHERE reviewedUserId IS NULL AND tasiyiciId IS NOT NULL`, () => {});
    
    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_reviewedUserId ON reviews(reviewedUserId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_reviewedUserType ON reviews(reviewedUserType)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_tasiyiciId ON reviews(tasiyiciId)`); // Keep for backward compatibility
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_jobId ON reviews(jobId)`);
  });
  db.close();
};

// Initialize table on module load
initReviewsTable();

// GET /api/reviews/tasiyici - Get reviews for tasiyici
router.get('/tasiyici', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID gerekli',
      });
    }

    const db = getDb();
    db.all(
      `SELECT r.*,
              u.firstName || ' ' || u.lastName as reviewerName,
              u.companyName as reviewerCompany
       FROM reviews r
       LEFT JOIN users u ON r.reviewerId = u.id
       WHERE (r.reviewedUserId = ? AND r.reviewedUserType = 'tasiyici') OR (r.tasiyiciId = ? AND r.reviewedUserId IS NULL)
       ORDER BY r.createdAt DESC`,
      [userId, userId],
      (err, rows) => {
        db.close();
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Değerlendirmeler alınırken hata oluştu',
            error: err.message,
          });
        }

        // Format reviews
        const reviews = (rows || []).map(row => ({
          id: row.id,
          reviewerName: row.reviewerName || 'Anonim',
          reviewerType: row.reviewerType || 'sender',
          rating: row.rating || 5,
          comment: row.comment || '',
          jobTitle: `İş #${row.jobId}`,
          jobId: row.jobId,
          date: row.createdAt || new Date().toISOString(),
          isVerified: Boolean(row.isVerified),
          helpful: row.helpful || 0,
          response: row.response || null,
          responseDate: row.responseDate || null,
        }));

        res.json({
          success: true,
          data: reviews,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Değerlendirmeler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/reviews/nakliyeci - Get reviews for nakliyeci
router.get('/nakliyeci', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID gerekli',
      });
    }

    const db = getDb();
    db.all(
      `SELECT r.*,
              u.firstName || ' ' || u.lastName as reviewerName,
              u.companyName as reviewerCompany
       FROM reviews r
       LEFT JOIN users u ON r.reviewerId = u.id
       WHERE r.reviewedUserId = ? AND r.reviewedUserType = 'nakliyeci'
       ORDER BY r.createdAt DESC`,
      [userId],
      (err, rows) => {
        db.close();
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Değerlendirmeler alınırken hata oluştu',
            error: err.message,
          });
        }

        // Format reviews
        const reviews = (rows || []).map(row => ({
          id: row.id,
          reviewerName: row.reviewerName || 'Anonim',
          reviewerType: row.reviewerType || 'individual',
          rating: row.rating || 5,
          comment: row.comment || '',
          jobTitle: `İş #${row.jobId}`,
          jobId: row.jobId,
          date: row.createdAt || new Date().toISOString(),
          isVerified: Boolean(row.isVerified),
          helpful: row.helpful || 0,
          response: row.response || null,
          responseDate: row.responseDate || null,
        }));

        res.json({
          success: true,
          data: reviews,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Değerlendirmeler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/reviews - Create new review
// Supports:
// - Individual/Corporate reviewing Nakliyeci: { reviewedUserId: nakliyeciId, reviewedUserType: 'nakliyeci', reviewerType: 'individual'/'corporate' }
// - Nakliyeci reviewing Tasiyici: { reviewedUserId: tasiyiciId, reviewedUserType: 'tasiyici', reviewerType: 'nakliyeci' }
router.post('/', (req, res) => {
  try {
    const {
      reviewedUserId, // New: Generic reviewed user ID (nakliyeci or tasiyici)
      reviewedUserType, // New: 'nakliyeci' or 'tasiyici'
      tasiyiciId, // Legacy: For backward compatibility
      reviewerId, // Who is making the review
      reviewerType, // 'individual', 'corporate', or 'nakliyeci'
      jobId,
      rating,
      comment,
    } = req.body;

    // Determine reviewedUserId and reviewedUserType
    let finalReviewedUserId = reviewedUserId || tasiyiciId;
    let finalReviewedUserType = reviewedUserType;
    
    // If using legacy tasiyiciId, set reviewedUserType to 'tasiyici'
    if (!finalReviewedUserType && tasiyiciId) {
      finalReviewedUserType = 'tasiyici';
    }
    
    // If reviewerType is 'nakliyeci', then reviewedUserType must be 'tasiyici'
    if (reviewerType === 'nakliyeci' && !finalReviewedUserType) {
      finalReviewedUserType = 'tasiyici';
    }
    
    // If reviewerType is 'individual' or 'corporate', and no reviewedUserType, assume 'nakliyeci'
    if ((reviewerType === 'individual' || reviewerType === 'corporate') && !finalReviewedUserType) {
      finalReviewedUserType = 'nakliyeci';
    }

    if (!finalReviewedUserId || !reviewerId || !jobId || !rating || !finalReviewedUserType) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik: reviewedUserId (veya tasiyiciId), reviewedUserType, reviewerId, reviewerType, jobId, rating',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating 1-5 arası olmalı',
      });
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Insert with both new and legacy fields for backward compatibility
    db.run(
      `INSERT INTO reviews (reviewedUserId, reviewedUserType, tasiyiciId, reviewerId, reviewerType, jobId, rating, comment, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalReviewedUserId,
        finalReviewedUserType,
        finalReviewedUserType === 'tasiyici' ? finalReviewedUserId : null, // Set tasiyiciId for backward compatibility
        reviewerId,
        reviewerType || (finalReviewedUserType === 'nakliyeci' ? 'individual' : 'nakliyeci'),
        jobId,
        rating,
        comment || '',
        now,
        now,
      ],
      function (err) {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Değerlendirme oluşturulamadı',
            error: err.message,
          });
        }

        db.get('SELECT * FROM reviews WHERE id = ?', [this.lastID], (err2, row) => {
          db.close();
          if (err2) {
            return res.status(500).json({
              success: false,
              message: 'Değerlendirme oluşturuldu ancak getirilemedi',
              error: err2.message,
            });
          }

          res.status(201).json({
            success: true,
            message: 'Değerlendirme başarıyla oluşturuldu',
            data: row,
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Değerlendirme oluşturulamadı',
      error: error.message,
    });
  }
});

module.exports = router;

