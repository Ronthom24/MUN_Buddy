-- ============================================
-- MUN Buddy: Modular per-capability RBAC on top of organizer_access.role
-- Version: 1.0
-- Run after 05_organizations.sql
--
-- Spec Chapter 4.7/4.10: permissions are modular capabilities, not just fixed
-- roles ("No Executive Board member automatically receives full access. The
-- Main Organizer explicitly grants permissions"). role_permissions defines
-- the default capability set per organizer_access.role; individual staff
-- members can be granted/denied specific capabilities beyond their role's
-- default via organizer_access_permission_overrides.
--
-- Existing organizer_access.role values (owner, conference_manager,
-- organizer, committee_director) are kept as-is -- they map 1:1 onto the
-- spec's Main Organizer / Executive Board / Organizing Committee / Committee
-- Director hierarchy; only the internal enum labels differ from the spec's
-- prose, not the behavior.
-- ============================================

USE mun_buddy;

CREATE TABLE IF NOT EXISTS permissions (
    `key` VARCHAR(100) PRIMARY KEY,
    label VARCHAR(150) NOT NULL,
    module VARCHAR(60) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
    role ENUM('owner', 'conference_manager', 'organizer', 'committee_director') NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    PRIMARY KEY (role, permission_key),
    CONSTRAINT fk_role_permissions_key FOREIGN KEY (permission_key) REFERENCES permissions(`key`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizer_access_permission_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_access_id INT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_oapo_access FOREIGN KEY (organizer_access_id) REFERENCES organizer_access(id) ON DELETE CASCADE,
    CONSTRAINT fk_oapo_key FOREIGN KEY (permission_key) REFERENCES permissions(`key`) ON DELETE CASCADE,
    UNIQUE KEY uq_oapo_access_key (organizer_access_id, permission_key)
) ENGINE=InnoDB;

-- ============================================
-- Seed permission catalog (spec 4.7/4.11 examples)
-- ============================================
INSERT INTO permissions (`key`, label, module) VALUES
    ('view_registrations', 'View registrations', 'registration'),
    ('approve_registrations', 'Approve registrations', 'registration'),
    ('reject_registrations', 'Reject registrations', 'registration'),
    ('edit_registration_form', 'Edit registration form', 'registration'),
    ('verify_payments', 'Verify payments', 'payments'),
    ('view_committees', 'View committees', 'committee'),
    ('create_committees', 'Create committees', 'committee'),
    ('edit_committees', 'Edit committees', 'committee'),
    ('delete_committees', 'Delete committees', 'committee'),
    ('create_portfolios', 'Create portfolios', 'portfolio'),
    ('edit_portfolios', 'Edit portfolios', 'portfolio'),
    ('assign_delegates', 'Assign delegates', 'assignments'),
    ('upload_resources', 'Upload resources', 'resources'),
    ('publish_announcements', 'Publish announcements', 'announcements'),
    ('manage_schedules', 'Manage schedules', 'schedules'),
    ('view_analytics', 'View analytics', 'analytics'),
    ('export_reports', 'Export reports', 'analytics'),
    ('manage_certificates', 'Manage certificates', 'certificates'),
    ('manage_payments', 'Manage payments', 'payments'),
    ('view_financials', 'View financial data', 'payments'),
    ('manage_team', 'Manage team members', 'users'),
    ('manage_conference_settings', 'Manage conference settings', 'conference')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- ============================================
-- Default role -> permission grants
-- ============================================

-- owner (Main Organizer): everything
INSERT INTO role_permissions (role, permission_key)
SELECT 'owner', `key` FROM permissions
ON DUPLICATE KEY UPDATE role = role;

-- conference_manager (Executive Board): everything except deleting the
-- conference itself (that's a conference-level action, not a permission key,
-- gated separately by requireConferenceAccess(...OWNER_ONLY) at the route)
INSERT INTO role_permissions (role, permission_key)
SELECT 'conference_manager', `key` FROM permissions
ON DUPLICATE KEY UPDATE role = role;

-- organizer (Organizing Committee): narrower operational default, tunable
-- per-member via organizer_access_permission_overrides
INSERT INTO role_permissions (role, permission_key) VALUES
    ('organizer', 'view_registrations'),
    ('organizer', 'approve_registrations'),
    ('organizer', 'reject_registrations'),
    ('organizer', 'verify_payments'),
    ('organizer', 'view_committees'),
    ('organizer', 'upload_resources'),
    ('organizer', 'publish_announcements'),
    ('organizer', 'view_analytics')
ON DUPLICATE KEY UPDATE role = role;

-- committee_director: scoped to their own committee (committee_id scoping is
-- enforced separately in auth.js's requireCommitteeAccess-family middleware)
INSERT INTO role_permissions (role, permission_key) VALUES
    ('committee_director', 'view_committees'),
    ('committee_director', 'edit_committees'),
    ('committee_director', 'assign_delegates'),
    ('committee_director', 'upload_resources'),
    ('committee_director', 'publish_announcements')
ON DUPLICATE KEY UPDATE role = role;
