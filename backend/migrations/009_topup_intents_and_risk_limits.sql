-- Wallet top-up intents + basic risk limits support

CREATE TABLE IF NOT EXISTS topup_intents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider VARCHAR(32) NOT NULL, -- 'stripe' | 'iyzico' | 'mock'
  provider_intent_id VARCHAR(128) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'TRY',
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending|succeeded|failed|cancelled
  risk_decision VARCHAR(32) DEFAULT 'allow', -- allow|review|block
  risk_reason TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_provider_intent
  ON topup_intents(provider, provider_intent_id);

CREATE INDEX IF NOT EXISTS idx_topup_user_created
  ON topup_intents(user_id, created_at);
