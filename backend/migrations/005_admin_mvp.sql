-- 005_admin_mvp.sql

-- Users: add admin_ref for fast lookup (safe, optional)
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS admin_ref VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_admin_ref ON users(admin_ref);

-- Admin Flags
-- References users.id type dynamically using regtype
DO $$
DECLARE
  user_id_type regtype;
BEGIN
  SELECT a.atttypid::regtype
    INTO user_id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'users'
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped
  LIMIT 1;

  IF user_id_type IS NULL THEN
    user_id_type := 'text'::regtype;
  END IF;

  EXECUTE format($f$
    CREATE TABLE IF NOT EXISTS admin_flags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(20) NOT NULL CHECK (type IN ('spam','dispute')),
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
      target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user','shipment','offer','complaint')),
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by %s NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_by %s NULL,
      resolved_at TIMESTAMP,
      resolution_notes TEXT
    )
  $f$, user_id_type, user_id_type);

  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_flags_status ON admin_flags(status)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_flags_type ON admin_flags(type)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_flags_target ON admin_flags(target_type, target_id)';
END $$;

-- Admin Tasks
DO $$
DECLARE
  user_id_type regtype;
BEGIN
  SELECT a.atttypid::regtype
    INTO user_id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  WHERE c.relname = 'users'
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped
  LIMIT 1;

  IF user_id_type IS NULL THEN
    user_id_type := 'text'::regtype;
  END IF;

  EXECUTE format($f$
    CREATE TABLE IF NOT EXISTS admin_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done')),
      due_at TIMESTAMP,
      linked_type VARCHAR(20),
      linked_id TEXT,
      created_by %s NULL,
      assigned_to %s NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  $f$, user_id_type, user_id_type);

  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_tasks_priority ON admin_tasks(priority)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_at ON admin_tasks(due_at)';
END $$;
