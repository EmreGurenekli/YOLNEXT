const express = require('express');

function createAgreementsRoutes(pool, authenticateToken) {
  const router = express.Router();

  // Frontend expects: { agreements: [] }
  router.get('/individual', authenticateToken, async (_req, res) => {
    return res.json({ agreements: [] });
  });

  return router;
}

module.exports = createAgreementsRoutes;
