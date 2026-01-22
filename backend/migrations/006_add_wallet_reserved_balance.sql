-- Add reserved balance for commission holds

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS reserved_balance DECIMAL(10,2) DEFAULT 0.00;

-- Safety: ensure no NULLs
UPDATE wallets
  SET reserved_balance = 0.00
  WHERE reserved_balance IS NULL;
