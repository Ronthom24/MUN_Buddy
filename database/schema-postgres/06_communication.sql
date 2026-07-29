-- ============================================
-- Announcements
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE CASCADE,
    portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general_update' CHECK (category IN
        ('general_update', 'registration', 'assignments', 'resources', 'committee_update', 'emergency_notice')),
    target_audience TEXT NOT NULL DEFAULT 'all'
        CHECK (target_audience IN ('all', 'delegates', 'organizers', 'committee_staff')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    content TEXT NOT NULL,
    attachment_path TEXT,
    publish_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_announcements_conference ON announcements(conference_id);
CREATE INDEX idx_announcements_deleted_at ON announcements(deleted_at);
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS announcement_reads (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    announcement_id BIGINT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (announcement_id, delegate_id)
);

-- ============================================
-- Resources
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN
        ('background_guide', 'research_paper', 'rules_of_procedure', 'conference_handbook', 'position_paper_guide', 'other')),
    tags TEXT,
    description TEXT,
    file_path TEXT,
    version INT NOT NULL DEFAULT 1,
    visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'assigned', 'organizers')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    download_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_resources_conference ON resources(conference_id);
CREATE INDEX idx_resources_deleted_at ON resources(deleted_at);
CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS resource_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    version INT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FAQs
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN
        ('registration', 'committees', 'venue', 'accommodation', 'certificates', 'payments', 'schedule', 'resources', 'general')),
    question TEXT NOT NULL,
    answer TEXT,
    asked_by_delegate_id BIGINT REFERENCES delegates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'published', 'archived')),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    answered_by_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_faqs_conference_status ON faqs(conference_id, status);
CREATE TRIGGER trg_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Notifications. recipient_id is polymorphic (organizer_access.id or
-- delegates.id depending on recipient_type) -- unchanged from before, no FK.
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT REFERENCES conferences(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('organizer', 'delegate')),
    recipient_id BIGINT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'reminder', 'warning', 'success', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id, read_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('organizer', 'delegate')),
    recipient_id BIGINT NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recipient_type, recipient_id)
);
CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Email templates / broadcasts
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS email_broadcasts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'all'
        CHECK (audience IN ('all', 'approved', 'committee', 'waitlisted', 'rejected')),
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_by_access_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_broadcast_recipients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    broadcast_id BIGINT NOT NULL REFERENCES email_broadcasts(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT
);
CREATE INDEX idx_email_broadcast_recipients_broadcast ON email_broadcast_recipients(broadcast_id, status);
