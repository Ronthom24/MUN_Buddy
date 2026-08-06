-- ============================================
-- MUN Buddy: Platform Administration (Super Admin) module
-- Version: 1.0
-- Run after 13_audit_security_hardening.sql
--
-- Platform Administration coding spec (user-supplied, 2026-07-17). Adds a
-- genuinely separate admin identity/auth realm (platform_admins, its own
-- JWT secret -- see backend/src/utils/platformJwt.js), a key-value global
-- settings store, suspend/activate + force-logout support for organizers
-- and delegates, and an admin-disable flag for conferences.
-- ============================================

USE mun_buddy;

-- ============================================
-- Platform Administrators: separate table, separate trust boundary from
-- organizers/delegates. Typically one row (seeded via
-- backend/scripts/seedPlatformAdmin.js / `npm run seed:production`), but the
-- table supports more for a future multi-admin release.
-- ============================================
CREATE TABLE IF NOT EXISTS platform_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- Platform Settings: simple key-value global config store. Seeded with the
-- settings this pass actually wires up (System Settings spec ch.14) --
-- SMTP stays env-configured, Terms/Privacy stay static pages, per scope
-- decisions recorded in the implementation plan.
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO platform_settings (setting_key, setting_value) VALUES
    ('platform_name', 'MUN Buddy'),
    ('platform_logo_path', NULL),
    ('maintenance_mode', 'false'),
    ('default_timezone', 'UTC')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- ============================================
-- Widen audit_logs / login_history to recognize platform_admin as a real
-- actor type, so the admin-view bridge (mint endpoint) and platform-admin
-- logins can be attributed honestly rather than logged as 'system'.
-- ============================================
ALTER TABLE audit_logs MODIFY COLUMN actor_type ENUM('organizer', 'delegate', 'system', 'platform_admin') NOT NULL DEFAULT 'organizer';
ALTER TABLE login_history MODIFY COLUMN user_type ENUM('organizer', 'delegate', 'platform_admin') NOT NULL;

-- ============================================
-- Organizer + delegate account status (suspend/activate, spec ch.10) and
-- token_version (force-logout, spec ch.13). delegates uses `account_status`,
-- deliberately NOT `status` -- that column already means the registration
-- workflow state (pending/approved/rejected); reusing it would corrupt
-- approve/reject logic.
-- ============================================
ALTER TABLE organizers
    ADD COLUMN status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER password_hash,
    ADD COLUMN suspended_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN suspended_reason VARCHAR(255) NULL,
    ADD COLUMN token_version INT NOT NULL DEFAULT 0,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE delegates
    ADD COLUMN account_status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER status,
    ADD COLUMN suspended_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN token_version INT NOT NULL DEFAULT 0;

-- ============================================
-- Conference admin-disable (spec ch.8) -- a pure platform-admin override,
-- kept distinct from the existing draft/published/archived workflow status.
-- ============================================
ALTER TABLE conferences ADD COLUMN admin_disabled BOOLEAN NOT NULL DEFAULT FALSE;
