-- ============================================
-- MUN Buddy: Audit Logging + Soft Deletes + Login History (Phase 8)
-- Version: 1.0
-- Run after 12_team_and_public_site.sql
--
-- Spec Chapter 22 (Security, Authorization & Audit System) + Chapter 17
-- (Analytics & Intelligence Center). Rate limiting, session expiry, and file
-- upload validation (22.13/22.5/22.15) are enforced in application code
-- (backend/src/middleware) rather than schema, so nothing to add for those
-- here.
-- ============================================

USE mun_buddy;

-- ============================================
-- Audit Logs: immutable, full before/after record (spec 22.16), distinct
-- from the lightweight team_activity feed (Phase 7) which stays a
-- human-readable string log. Every audit-worthy action writes here too.
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NULL,
    actor_type ENUM('organizer', 'delegate', 'system') NOT NULL DEFAULT 'organizer',
    actor_email VARCHAR(190) NULL,
    actor_name VARCHAR(150) NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id INT NULL,
    previous_value JSON NULL,
    new_value JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_audit_logs_conference ON audit_logs(conference_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================
-- Login History (spec 22.17): every login attempt, success or failure.
-- Session management itself stays deliberately short-lived-JWT-only per the
-- Phase 1 design ("always-fresh authorization" -- see docs/Architecture.md);
-- this table is the audit trail spec 22.17 actually asks for, not a session
-- store.
-- ============================================
CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('organizer', 'delegate') NOT NULL,
    user_id INT NULL,
    email VARCHAR(190) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_login_history_user ON login_history(user_type, user_id, created_at);

-- ============================================
-- Soft deletes (spec 22.21). organizations already has deleted_at (Phase 1).
-- Certificates are deliberately excluded: they're immutable verification
-- records with no existing delete path (spec 19.17), so there is nothing to
-- soft-delete yet. Delegates keep their existing status enum (withdrawn)
-- instead of a parallel soft-delete, since that already models "no longer
-- active" without a second mechanism.
-- ============================================
ALTER TABLE conferences ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
ALTER TABLE committees ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
ALTER TABLE portfolios ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE resources ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
ALTER TABLE announcements ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

CREATE INDEX idx_conferences_deleted_at ON conferences(deleted_at);
CREATE INDEX idx_committees_deleted_at ON committees(deleted_at);
CREATE INDEX idx_resources_deleted_at ON resources(deleted_at);
CREATE INDEX idx_announcements_deleted_at ON announcements(deleted_at);

-- ============================================
-- New permission keys for this phase (audit/analytics/export access reuse
-- the existing view_analytics/export_reports/manage_team keys from
-- 06_permissions.sql -- nothing new needed there).
-- ============================================
