-- ============================================
-- Agendas
-- ============================================
CREATE TABLE IF NOT EXISTS agendas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    committee_id BIGINT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    background_notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    publication_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agendas_committee ON agendas(committee_id);
CREATE TRIGGER trg_agendas_updated_at BEFORE UPDATE ON agendas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Portfolios
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    committee_id BIGINT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'country' CHECK (type IN ('country', 'position', 'observer')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_portfolios_committee ON portfolios(committee_id);
CREATE TRIGGER trg_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Delegates: per-conference application/membership rows keyed by profile_id
-- (NOT NULL -- a delegate application always belongs to a real Supabase
-- identity, created either via fresh sign-up or by an existing account
-- applying to another conference). `account_status` stays conference-scoped
-- (unchanged from before) since one profile can hold many delegate rows.
-- ============================================
CREATE TABLE IF NOT EXISTS delegates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school TEXT,
    grade TEXT,
    mun_experience TEXT NOT NULL DEFAULT 'beginner' CHECK (mun_experience IN ('beginner', '1-3', '4-10', '10+')),
    profile_text TEXT,
    special_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
    suspended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conference_id, profile_id)
);
CREATE INDEX idx_delegates_conference ON delegates(conference_id);
CREATE INDEX idx_delegates_status ON delegates(conference_id, status);
CREATE INDEX idx_delegates_profile ON delegates(profile_id);
CREATE TRIGGER trg_delegates_updated_at BEFORE UPDATE ON delegates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Delegate committee/country preferences (ranked 1-3)
-- ============================================
CREATE TABLE IF NOT EXISTS delegate_committee_preferences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    committee_id BIGINT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    preference_rank SMALLINT NOT NULL,
    UNIQUE (delegate_id, preference_rank)
);

CREATE TABLE IF NOT EXISTS delegate_country_preferences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    preference_rank SMALLINT NOT NULL,
    UNIQUE (delegate_id, preference_rank)
);

-- ============================================
-- Assignments (delegate -> committee + portfolio, publish-gated)
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL UNIQUE REFERENCES delegates(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'assigned')),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS assignment_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('assigned', 'reassigned', 'unassigned')),
    changed_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ah_delegate ON assignment_history(delegate_id);

-- ============================================
-- Registration forms + responses
-- ============================================
CREATE TABLE IF NOT EXISTS registration_forms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    schema_json JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_registration_forms_conference ON registration_forms(conference_id);
CREATE TRIGGER trg_registration_forms_updated_at BEFORE UPDATE ON registration_forms
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS delegate_registration_responses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL UNIQUE REFERENCES delegates(id) ON DELETE CASCADE,
    form_id BIGINT NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
    responses_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
