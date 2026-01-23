const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.user.userId}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, and PDF files are allowed.'
        )
      );
    }
  },
});

// Upload KYC document
router.post(
  '/upload',
  authenticateToken,
  upload.single('document'),
  [
    body('document_type')
      .isIn([
        'id_card',
        'passport',
        'driver_license',
        'company_registration',
        'tax_certificate',
      ])
      .withMessage('Invalid document type'),
    body('document_number')
      .optional()
      .isString()
      .withMessage('Document number must be a string'),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { document_type, document_number } = req.body;
      const userId = req.user.userId;
      const filePath = req.file.path;

      // Check if document type already exists for user
      db.get(
        `SELECT id FROM kyc_documents WHERE user_id = ? AND document_type = ? AND status != 'rejected'`,
        [userId, document_type],
        (err, existingDoc) => {
          if (err) {
            console.error('Check existing document error:', err);
            return res
              .status(500)
              .json({ error: 'Failed to check existing document' });
          }

          if (existingDoc) {
            // Delete uploaded file
            fs.unlinkSync(filePath);
            return res
              .status(400)
              .json({ error: 'Document of this type already exists' });
          }

          // Create KYC document record
          db.run(
            `INSERT INTO kyc_documents (user_id, document_type, document_number, file_path, status)
           VALUES (?, ?, ?, ?, 'pending')`,
            [userId, document_type, document_number, filePath],
            function (err) {
              if (err) {
                console.error('Create KYC document error:', err);
                // Delete uploaded file
                fs.unlinkSync(filePath);
                return res
                  .status(500)
                  .json({ error: 'Failed to create document record' });
              }

              res.status(201).json({
                message: 'Document uploaded successfully',
                document: {
                  id: this.lastID,
                  document_type,
                  document_number,
                  status: 'pending',
                  uploaded_at: new Date().toISOString(),
                },
              });
            }
          );
        }
      );
    } catch (error) {
      console.error('KYC upload error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get user KYC documents
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT id, document_type, document_number, status, created_at, verified_at, rejection_reason
     FROM kyc_documents WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, documents) => {
      if (err) {
        console.error('Get KYC documents error:', err);
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }

      res.json(documents);
    }
  );
});

// Get KYC document by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.get(
    `SELECT * FROM kyc_documents WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, document) => {
      if (err) {
        console.error('Get KYC document error:', err);
        return res.status(500).json({ error: 'Failed to fetch document' });
      }

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    }
  );
});

// Download KYC document
router.get('/:id/download', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.get(
    `SELECT file_path, document_type FROM kyc_documents WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, document) => {
      if (err) {
        console.error('Get document path error:', err);
        return res.status(500).json({ error: 'Failed to fetch document path' });
      }

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({ error: 'Document file not found' });
      }

      const fileName = `${document.document_type}_${id}${path.extname(document.file_path)}`;
      res.download(document.file_path, fileName);
    }
  );
});

// Delete KYC document
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.get(
    `SELECT file_path FROM kyc_documents WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, document) => {
      if (err) {
        console.error('Get document for deletion error:', err);
        return res.status(500).json({ error: 'Failed to fetch document' });
      }

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete file
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }

      // Delete database record
      db.run(
        `DELETE FROM kyc_documents WHERE id = ? AND user_id = ?`,
        [id, userId],
        function (err) {
          if (err) {
            console.error('Delete KYC document error:', err);
            return res.status(500).json({ error: 'Failed to delete document' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Document not found' });
          }

          res.json({ message: 'Document deleted successfully' });
        }
      );
    }
  );
});

// Get KYC status
router.get('/status/overview', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT document_type, status, created_at, verified_at, rejection_reason
     FROM kyc_documents WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, documents) => {
      if (err) {
        console.error('Get KYC status error:', err);
        return res.status(500).json({ error: 'Failed to fetch KYC status' });
      }

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      const documentTypes = {
        id_card: false,
        passport: false,
        driver_license: false,
        company_registration: false,
        tax_certificate: false,
      };

      documents.forEach(doc => {
        statusCounts[doc.status]++;
        if (doc.status === 'approved') {
          documentTypes[doc.document_type] = true;
        }
      });

      const overallStatus =
        documents.length === 0
          ? 'not_started'
          : statusCounts.rejected > 0
            ? 'rejected'
            : statusCounts.pending > 0
              ? 'pending'
              : statusCounts.approved > 0
                ? 'approved'
                : 'not_started';

      res.json({
        overall_status: overallStatus,
        status_counts: statusCounts,
        document_types: documentTypes,
        documents: documents,
      });
    }
  );
});

// Admin: Get all KYC documents (for verification)
router.get('/admin/all', authenticateToken, (req, res) => {
  // Check if user is admin (you might want to add admin role check)
  const { status, document_type, page = 1, limit = 10 } = req.query;

  let query = `
    SELECT k.*, u.name, u.email, u.panel_type 
    FROM kyc_documents k 
    JOIN users u ON k.user_id = u.id
  `;
  let params = [];
  let conditions = [];

  if (status) {
    conditions.push('k.status = ?');
    params.push(status);
  }

  if (document_type) {
    conditions.push('k.document_type = ?');
    params.push(document_type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY k.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, documents) => {
    if (err) {
      console.error('Get all KYC documents error:', err);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM kyc_documents k 
      JOIN users u ON k.user_id = u.id
    `;
    let countParams = [];

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Get KYC documents count error:', err);
        return res
          .status(500)
          .json({ error: 'Failed to fetch documents count' });
      }

      res.json({
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit)),
        },
      });
    });
  });
});

// Admin: Verify KYC document
router.patch(
  '/admin/:id/verify',
  authenticateToken,
  [
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be approved or rejected'),
    body('rejection_reason')
      .optional()
      .isString()
      .withMessage('Rejection reason must be a string'),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, rejection_reason } = req.body;
      const verifiedBy = req.user.userId;

      const updateData = {
        status,
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
      };

      if (status === 'rejected' && rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      db.run(
        `UPDATE kyc_documents 
       SET status = ?, verified_at = ?, verified_by = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
        [
          updateData.status,
          updateData.verified_at,
          updateData.verified_by,
          updateData.rejection_reason || null,
          id,
        ],
        function (err) {
          if (err) {
            console.error('Verify KYC document error:', err);
            return res.status(500).json({ error: 'Failed to verify document' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Document not found' });
          }

          res.json({ message: 'Document verification updated successfully' });
        }
      );
    } catch (error) {
      console.error('Verify KYC document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
