-- ============================================
-- Awards
-- ============================================
CREATE TABLE IF NOT EXISTS awards (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    citation TEXT,
    assigned_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_awards_conference ON awards(conference_id);
CREATE INDEX idx_awards_delegate ON awards(delegate_id);

-- ============================================
-- Certificate templates
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    certificate_type TEXT NOT NULL DEFAULT 'participation'
        CHECK (certificate_type IN ('participation', 'award', 'workshop_participation', 'custom')),
    title TEXT NOT NULL DEFAULT 'Certificate of Participation',
    body_text TEXT NOT NULL,
    signatory_name TEXT,
    signatory_title TEXT,
    accent_color TEXT NOT NULL DEFAULT '#1f2937',
    logo_path TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cert_templates_org ON certificate_templates(organization_id);
CREATE TRIGGER trg_cert_templates_updated_at BEFORE UPDATE ON certificate_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    certificate_number TEXT NOT NULL UNIQUE,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    template_id BIGINT NOT NULL REFERENCES certificate_templates(id),
    award_id BIGINT REFERENCES awards(id) ON DELETE SET NULL,
    certificate_type TEXT NOT NULL DEFAULT 'participation'
        CHECK (certificate_type IN ('participation', 'award', 'workshop_participation', 'custom')),
    issued_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    download_count INT NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ
);
CREATE INDEX idx_certificates_conference ON certificates(conference_id);
CREATE INDEX idx_certificates_delegate ON certificates(delegate_id);
