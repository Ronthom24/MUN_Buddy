-- ============================================
-- organizer_access token_version (force-logout coverage, pre-deployment
-- punch list): staff invited via organizer_access previously got a JWT with
-- no `tv` claim at all, so suspending or force-logging-out the owning
-- organizer never revoked their sessions. Adds the same revoke-by-bumping
-- counter column the organizers/delegates tables already use (see
-- 14_platform_admin.sql).
-- ============================================
ALTER TABLE organizer_access
    ADD COLUMN token_version INT NOT NULL DEFAULT 0;
