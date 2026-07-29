-- ============================================
-- Audit logs / login history. actor_email/actor_name (audit_logs) and
-- email (login_history) stay free-text snapshots taken at the time of the
-- action -- deliberately not live FK joins to profiles, since audit trails
-- should reflect what was true at the time, not the current state of an
-- account that may since be renamed or deleted.
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT REFERENCES conferences(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL DEFAULT 'organizer'
        CHECK (actor_type IN ('organizer', 'delegate', 'system', 'platform_admin')),
    actor_email TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id BIGINT,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_conference ON audit_logs(conference_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE TABLE IF NOT EXISTS login_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_type TEXT NOT NULL CHECK (user_type IN ('organizer', 'delegate', 'platform_admin')),
    user_id BIGINT,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_history_user ON login_history(user_type, user_id, created_at);

CREATE TABLE IF NOT EXISTS team_activity (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    actor_email TEXT NOT NULL,
    actor_name TEXT,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_activity_conference ON team_activity(conference_id, created_at);

-- ============================================
-- Platform admin: a flag table now, not a credential store -- identity and
-- password live in Supabase Auth (via profiles) same as everyone else.
-- ============================================
CREATE TABLE IF NOT EXISTS platform_admins (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON platform_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO platform_settings (setting_key, setting_value) VALUES
    ('platform_name', 'MUN Buddy'),
    ('platform_logo_path', NULL),
    ('maintenance_mode', 'false'),
    ('default_timezone', 'UTC')
ON CONFLICT (setting_key) DO NOTHING;
