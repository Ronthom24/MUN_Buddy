-- ============================================
-- MUN Buddy: Organization tier (Organization -> Conference)
-- Version: 1.0
-- Run after 04_extended_auth_and_documents.sql
--
-- Organizations are the permanent, multi-conference tenant entity the rest of
-- the platform is built around (spec Chapter 5/8). conferences.organizer_id
-- is kept as-is (it still records who created that specific conference);
-- conferences.organization_id is what now carries tenancy/isolation.
--
-- Membership is keyed by email (not a FK to organizers.id) to match the
-- existing identity model used by organizer_access: a staff member who joined
-- purely via the invite-then-claim flow only ever gets an organizer_access
-- row and never gets a row in `organizers`, so email is the only identity key
-- guaranteed to exist for every kind of organizer-side account.
--
-- organization_id starts nullable so this migration is safe to run against a
-- database that already has rows in `conferences`. Run
-- backend/scripts/migrateOrganizersToOrganizations.js immediately after this
-- file to backfill a synthetic organization per existing organizer/conference.
-- All newly-created conferences (via the reworked authService) always set it.
-- ============================================

USE mun_buddy;

-- ============================================
-- Organizations (permanent tenant; owns many conferences)
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    logo_path VARCHAR(255),
    banner_path VARCHAR(255),
    website VARCHAR(255),
    contact_email VARCHAR(190),
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- ============================================
-- Organization Members (org-level roles: owner/admin/member), email-keyed
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    email VARCHAR(190) NOT NULL,
    full_name VARCHAR(150),
    org_role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
    status ENUM('invited', 'active', 'revoked') NOT NULL DEFAULT 'active',
    invited_by VARCHAR(190),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_members_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY uq_org_members_org_email (organization_id, email)
) ENGINE=InnoDB;

-- ============================================
-- Conferences now belong to an Organization
-- ============================================
ALTER TABLE conferences
  ADD COLUMN organization_id INT NULL AFTER organizer_id,
  ADD CONSTRAINT fk_conferences_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_conferences_organization ON conferences(organization_id);
CREATE INDEX idx_org_members_email ON organization_members(email);
