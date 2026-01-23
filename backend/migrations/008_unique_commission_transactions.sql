-- Prevent duplicate commission ledger entries for offers
-- This makes hold/release/capture idempotent even under race conditions.

-- Create a unique index for offer-related commission transactions
-- NOTE: Uses CONCURRENTLY? not allowed inside migration runner transaction; keep standard.
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_offer_commission
  ON transactions (user_id, type, reference_type, reference_id)
  WHERE reference_type = 'offer'
    AND type IN ('commission_hold', 'commission_release', 'commission_capture');
