-- ============================================
-- Fee categories
-- ============================================
CREATE TABLE IF NOT EXISTS fee_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_categories_conference ON fee_categories(conference_id);
CREATE TRIGGER trg_fee_categories_updated_at BEFORE UPDATE ON fee_categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Payments
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    fee_category_id BIGINT REFERENCES fee_categories(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'other')),
    transaction_reference TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'under_verification', 'verified', 'failed', 'refunded', 'cancelled')),
    payment_date DATE,
    notes TEXT,
    recorded_by TEXT NOT NULL DEFAULT 'delegate' CHECK (recorded_by IN ('delegate', 'organizer')),
    created_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    verified_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_conference ON payments(conference_id);
CREATE INDEX idx_payments_delegate ON payments(delegate_id);
CREATE INDEX idx_payments_status ON payments(conference_id, status);
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS refunds (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    refund_date DATE NOT NULL,
    approved_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refunds_conference ON refunds(conference_id);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);

CREATE TABLE IF NOT EXISTS discounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    fee_category_id BIGINT REFERENCES fee_categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN
        ('early_bird', 'institution_discount', 'organizer_waiver', 'scholarship', 'promotional_code', 'other')),
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    applied_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_discounts_conference ON discounts(conference_id);
CREATE INDEX idx_discounts_delegate ON discounts(delegate_id);
