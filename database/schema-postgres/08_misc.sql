-- ============================================
-- Resolutions, notes, feedback, delegate documents. Note: password_reset_tokens
-- and email_verification_tokens (from the old MySQL schema) are deliberately
-- NOT ported here -- Supabase Auth's built-in resetPasswordForEmail/email
-- confirmation flows replace them entirely.
-- ============================================
CREATE TABLE IF NOT EXISTS resolutions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    committee_id BIGINT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    agenda_id BIGINT REFERENCES agendas(id) ON DELETE SET NULL,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'under_review', 'passed', 'failed')),
    organizer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resolutions_conference ON resolutions(conference_id);
CREATE INDEX idx_resolutions_delegate ON resolutions(delegate_id);
CREATE TRIGGER trg_resolutions_updated_at BEFORE UPDATE ON resolutions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notes_delegate ON notes(delegate_id);
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'committee', 'logistics', 'other')),
    comments TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_conference ON feedback(conference_id);

CREATE TABLE IF NOT EXISTS delegate_documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    agenda_id BIGINT REFERENCES agendas(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('position_paper', 'speech')),
    title TEXT NOT NULL,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_delegate ON delegate_documents(delegate_id);
CREATE TRIGGER trg_delegate_documents_updated_at BEFORE UPDATE ON delegate_documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
