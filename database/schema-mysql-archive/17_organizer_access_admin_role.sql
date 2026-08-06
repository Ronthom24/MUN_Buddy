-- ============================================
-- Add 'admin' as a distinct organizer_access role, alongside owner/
-- conference_manager (Executive Board)/organizer (Organizing Committee)/
-- committee_director. Granted the same permission footprint as
-- conference_manager everywhere that role is checked (see auth.js,
-- committee/agenda/portfolio/conference routes, resolutionService.js) --
-- it's an additional full-access tier, not a narrower one.
-- ============================================
ALTER TABLE organizer_access
    MODIFY COLUMN role ENUM('owner', 'organizer', 'committee_director', 'conference_manager', 'admin')
    NOT NULL DEFAULT 'organizer';
