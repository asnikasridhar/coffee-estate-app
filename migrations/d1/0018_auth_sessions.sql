CREATE TABLE IF NOT EXISTS auth_session (
  auth_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_on TEXT NOT NULL,
  revoked_on TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_on TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_session_user_expiry
  ON auth_session(user_id, expires_on);

CREATE TABLE IF NOT EXISTS auth_login_attempt (
  attempt_key TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0,
  first_failure_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  blocked_until TEXT,
  modified_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vendor ADD COLUMN user_id INTEGER REFERENCES users(user_id);
UPDATE vendor SET user_id=COALESCE(user_id,1);
CREATE INDEX IF NOT EXISTS idx_vendor_user ON vendor(user_id);
