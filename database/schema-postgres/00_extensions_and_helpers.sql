-- ============================================
-- Extensions & shared helpers
-- ============================================

-- Shared trigger function: replaces MySQL's inline
-- `TIMESTAMP ... ON UPDATE CURRENT_TIMESTAMP` column clause, which has no
-- direct Postgres equivalent. Applied per-table below wherever the MySQL
-- schema had that clause.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Identity: profiles (Supabase Auth migration)
--
-- One Supabase Auth identity per email, platform-wide -- replaces the old
-- `organizers`/`delegates`/`organizer_access`/`platform_admins` tables each
-- separately owning their own email + password_hash. `organizer_access` and
-- `delegates` become pure per-conference membership/grant rows keyed by
-- profile_id (see 01/02); `platform_admins` becomes a flag table (see 07).
--
-- `status`/`suspended_at`/`suspended_reason` here is the direct successor of
-- the old `organizers.status` columns: platform-admin suspension of a
-- person's ability to operate as an organizer. Checked in the API layer
-- right after Supabase JWT verification (see backend auth middleware), not
-- by Supabase itself -- this is an app-level capability suspension, not an
-- account ban. Delegate-side suspension stays separate and conference-scoped
-- on `delegates.account_status` (see 02_committees_delegates.sql), since one
-- profile can have many delegate applications across different conferences.
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create a profile row whenever Supabase Auth creates a user (self
-- registration, invite, or admin-created), keeping `profiles.email` in sync
-- with the authoritative `auth.users.email`.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_handle_new_auth_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE TABLE IF NOT EXISTS _schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
