-- ============================================
-- login_history.user_id needs to hold either a delegates.id (bigint) or a
-- profiles.id (uuid, for organizer/platform_admin logins now that those are
-- Supabase Auth identities) -- widen to text to accept both.
-- ============================================
ALTER TABLE login_history
    ALTER COLUMN user_id TYPE TEXT USING user_id::text;
