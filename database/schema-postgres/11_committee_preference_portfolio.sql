-- ============================================
-- A delegate's committee preference can optionally include which portfolio
-- (country/position slot) they'd want within that committee -- portfolios
-- are scoped one-per-committee (portfolios.committee_id), so this has to be
-- a nullable pointer alongside the existing committee_id, not a separate
-- top-level preference table.
-- ============================================
ALTER TABLE delegate_committee_preferences
    ADD COLUMN IF NOT EXISTS portfolio_id BIGINT REFERENCES portfolios(id) ON DELETE SET NULL;
