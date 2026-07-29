-- ============================================
-- Organizations
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_path TEXT,
    banner_path TEXT,
    website TEXT,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Organization members (owner/admin/member grants) -- keyed by profile_id
-- instead of a bare email column, now that email is Supabase Auth's job.
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    invite_email TEXT NOT NULL,
    org_role TEXT NOT NULL DEFAULT 'member' CHECK (org_role IN ('owner', 'admin', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'revoked')),
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, invite_email)
);
CREATE INDEX idx_org_members_profile ON organization_members(profile_id);
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Conferences
-- ============================================
CREATE TABLE IF NOT EXISTS conferences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Informational only ("who created this conference") -- NOT an
    -- authorization source. Access control runs entirely through
    -- organizer_access rows + the organization_members owner/admin fallback
    -- (see resolveConferenceAccess in the backend auth middleware).
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    acronym TEXT,
    short_name TEXT,
    institution TEXT,
    location TEXT,
    website TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    registration_status TEXT NOT NULL DEFAULT 'closed' CHECK (registration_status IN ('open', 'closed', 'invite_only')),
    max_delegates INT,
    conference_code TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE,
    waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    allow_reapplication BOOLEAN NOT NULL DEFAULT FALSE,
    payment_required BOOLEAN NOT NULL DEFAULT FALSE,
    currency TEXT NOT NULL DEFAULT 'INR',
    results_published BOOLEAN NOT NULL DEFAULT FALSE,
    results_published_at TIMESTAMPTZ,
    admin_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_conferences_organization ON conferences(organization_id);
CREATE INDEX idx_conferences_deleted_at ON conferences(deleted_at);
CREATE TRIGGER trg_conferences_updated_at BEFORE UPDATE ON conferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Committees (defined here, ahead of organizer_access/departments below,
-- since both reference it -- committee/agenda/portfolio detail tables live
-- in 02_committees_delegates.sql, this is just the parent row)
-- ============================================
CREATE TABLE IF NOT EXISTS committees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    chair TEXT,
    vice_chair TEXT,
    capacity INT,
    type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'crisis')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_committees_conference ON committees(conference_id);
CREATE INDEX idx_committees_deleted_at ON committees(deleted_at);
CREATE TRIGGER trg_committees_updated_at BEFORE UPDATE ON committees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Departments (conference-level org units, referenced by organizer_access)
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conference_id, name)
);

-- ============================================
-- Organizer access (per-conference staff grants). `invite_email` is always
-- set (the invite target); `profile_id` fills in once the invite is
-- claimed -- either by an existing Supabase Auth identity or a fresh
-- sign-up -- mirroring the old password_hash-IS-NULL "unclaimed" marker.
--
-- `status` replaces the old token_version-bump-to-revoke pattern for
-- conference-scoped access: suspending/force-logging-out the owning
-- organizer sets every one of their staff's organizer_access.status to
-- 'revoked' (see backend platformUserService), checked in
-- resolveConferenceAccess same as before.
-- ============================================
CREATE TABLE IF NOT EXISTS organizer_access (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    invite_email TEXT NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'organizer'
        CHECK (role IN ('owner', 'organizer', 'committee_director', 'conference_manager', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    position_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conference_id, invite_email)
);
CREATE INDEX idx_organizer_access_committee ON organizer_access(committee_id);
CREATE INDEX idx_organizer_access_profile ON organizer_access(profile_id);

-- ============================================
-- Permission catalog + role defaults + per-member overrides
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    module TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT NOT NULL CHECK (role IN ('owner', 'conference_manager', 'organizer', 'committee_director', 'admin')),
    permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_key)
);

CREATE TABLE IF NOT EXISTS organizer_access_permission_overrides (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizer_access_id BIGINT NOT NULL REFERENCES organizer_access(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organizer_access_id, permission_key)
);

-- ============================================
-- Seed permission catalog
-- ============================================
INSERT INTO permissions (key, label, module) VALUES
    ('view_registrations', 'View registrations', 'registration'),
    ('approve_registrations', 'Approve registrations', 'registration'),
    ('reject_registrations', 'Reject registrations', 'registration'),
    ('edit_registration_form', 'Edit registration form', 'registration'),
    ('verify_payments', 'Verify payments', 'payments'),
    ('view_committees', 'View committees', 'committee'),
    ('create_committees', 'Create committees', 'committee'),
    ('edit_committees', 'Edit committees', 'committee'),
    ('delete_committees', 'Delete committees', 'committee'),
    ('create_portfolios', 'Create portfolios', 'committee'),
    ('edit_portfolios', 'Edit portfolios', 'committee'),
    ('assign_delegates', 'Assign delegates', 'committee'),
    ('upload_resources', 'Upload resources', 'communication'),
    ('publish_announcements', 'Publish announcements', 'communication'),
    ('manage_schedules', 'Manage schedules', 'schedule'),
    ('view_analytics', 'View analytics', 'analytics'),
    ('export_reports', 'Export reports', 'analytics'),
    ('manage_certificates', 'Manage certificates', 'results'),
    ('manage_payments', 'Manage payments', 'payments'),
    ('view_financials', 'View financials', 'payments'),
    ('manage_team', 'Manage team', 'team'),
    ('manage_conference_settings', 'Manage conference settings', 'settings'),
    ('manage_attendance', 'Manage attendance', 'attendance'),
    ('answer_faqs', 'Answer FAQs', 'communication'),
    ('send_broadcasts', 'Send broadcasts', 'communication')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Seed role defaults. 'admin' mirrors 'conference_manager' -- in the old
-- MySQL schema, organizer_access.role gained an 'admin' value (17) but
-- role_permissions.role never did, leaving 'admin' to rely on undocumented
-- app-code fallback. Closed here: 'admin' gets the same grants.
-- ============================================
INSERT INTO role_permissions (role, permission_key)
SELECT 'owner', key FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_key)
SELECT 'conference_manager', key FROM permissions
WHERE key NOT IN ('manage_conference_settings')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_key)
SELECT 'admin', key FROM permissions
WHERE key NOT IN ('manage_conference_settings')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_key) VALUES
    ('organizer', 'view_registrations'), ('organizer', 'approve_registrations'),
    ('organizer', 'view_committees'), ('organizer', 'assign_delegates'),
    ('organizer', 'upload_resources'), ('organizer', 'view_analytics')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_key) VALUES
    ('committee_director', 'view_committees'), ('committee_director', 'edit_committees'),
    ('committee_director', 'create_portfolios'), ('committee_director', 'edit_portfolios'),
    ('committee_director', 'upload_resources')
ON CONFLICT DO NOTHING;
