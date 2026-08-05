-- ============================================
-- Real force-logout for the Supabase Auth migration.
--
-- There's no Supabase admin API to instantly kill an already-issued access
-- token short of banning the account (wrong semantic -- that also blocks
-- future logins) or waiting for natural expiry (~1h default). This restores
-- the old organizers.token_version bump-to-revoke pattern using a
-- timestamp instead of a counter: `authenticate` (middleware/auth.js)
-- compares the verified token's `iat` claim against this column after every
-- Supabase JWKS verification, rejecting any token issued before the last
-- revocation -- same immediacy the old token_version check had, at the
-- same cost (one indexed lookup per request).
-- ============================================
ALTER TABLE profiles
    ADD COLUMN sessions_revoked_at TIMESTAMPTZ;
