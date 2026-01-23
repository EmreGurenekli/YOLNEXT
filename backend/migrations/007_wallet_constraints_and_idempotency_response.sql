-- Wallet constraints + idempotency response snapshot support

-- 1) Wallet constraints (use NOT VALID to avoid failing if legacy data exists)
DO $$
BEGIN
  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_reserved_balance_nonnegative'
  ) THEN
    ALTER TABLE wallets
      ADD CONSTRAINT wallets_reserved_balance_nonnegative
      CHECK (reserved_balance >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_reserved_balance_not_exceed_balance'
  ) THEN
    ALTER TABLE wallets
      ADD CONSTRAINT wallets_reserved_balance_not_exceed_balance
      CHECK (reserved_balance <= balance) NOT VALID;
  END IF;
END $$;

-- Validate if possible (safe to run multiple times)
DO $$
BEGIN
  BEGIN
    ALTER TABLE wallets VALIDATE CONSTRAINT wallets_reserved_balance_nonnegative;
  EXCEPTION WHEN others THEN
    -- ignore
  END;

  BEGIN
    ALTER TABLE wallets VALIDATE CONSTRAINT wallets_reserved_balance_not_exceed_balance;
  EXCEPTION WHEN others THEN
    -- ignore
  END;
END $$;

-- 2) Idempotency response snapshot columns
ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS status_code INTEGER;

ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS response_body JSONB;

ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS response_headers JSONB;

