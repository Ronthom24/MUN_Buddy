-- ============================================
-- MUN Buddy: Results & Certificates + Attendance/QR (Phase 5)
-- Version: 1.0
-- Run after 09_payments.sql
--
-- Spec Chapter 19 (Results, Awards & Certificate Center) + spec 25.4's V1
-- Attendance bullet list (QR Code Generation, QR Check-In, Session
-- Attendance, Attendance Reports -- there is no dedicated Attendance
-- chapter in the spec; earlier chapters list "Attendance" only as a
-- Future Enhancement, but 25.4's Version 1 feature checklist is what
-- Architecture.md treats as authoritative for V1 scope).
--
-- Scoping decisions (documented, not silent trims):
-- - Certificates are delegate-facing only in V1 (participation/award/
--   workshop/custom). Spec 19.7 also lists organizer/EB/volunteer/sponsor
--   certificate types; issuing certificates to non-delegate recipients
--   would require unifying delegate and organizer_access identity, which
--   is out of scope for this phase.
-- - Certificate templates are reusable across an organization's
--   conferences (spec 19.8), so they hang off organizations, not
--   conferences.
-- - "QR Check-In" is served by a persistent per-delegate check-in token
--   (rendered as a QR code) that an organizer can redeem either by
--   clicking a delegate in a roster (manual) or by scanning/typing the
--   token (what a real handheld QR/barcode scanner emits is keyboard
--   input into a text field -- there is no camera-based scanning UI in
--   V1, since that needs hardware this environment can't verify).
-- ============================================

USE mun_buddy;

-- ============================================
-- Results visibility (spec 19.13): a single publish gate for the whole
-- conference's award set, mirroring how assignments.published works.
-- ============================================
ALTER TABLE conferences
  ADD COLUMN results_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN results_published_at TIMESTAMP NULL;

-- ============================================
-- Awards (spec 19.5/19.6): category is free text, not a fixed enum --
-- spec explicitly allows unlimited custom categories.
-- ============================================
CREATE TABLE IF NOT EXISTS awards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    delegate_id INT NOT NULL,
    committee_id INT NULL,
    portfolio_id INT NULL,
    category VARCHAR(150) NOT NULL,
    citation TEXT NULL,
    assigned_by_organizer_access_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_awards_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_awards_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_awards_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL,
    CONSTRAINT fk_awards_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL,
    CONSTRAINT fk_awards_access FOREIGN KEY (assigned_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Certificate Templates (spec 19.7/19.8): organization-scoped, reused
-- across that organization's conferences. body_text supports dynamic
-- {{fields}} (spec 19.9) resolved at generation time.
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    certificate_type ENUM('participation', 'award', 'workshop_participation', 'custom') NOT NULL DEFAULT 'participation',
    title VARCHAR(200) NOT NULL DEFAULT 'Certificate of Participation',
    body_text TEXT NOT NULL,
    signatory_name VARCHAR(150) NULL,
    signatory_title VARCHAR(150) NULL,
    accent_color VARCHAR(7) NOT NULL DEFAULT '#1f2937',
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cert_templates_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Certificates (spec 19.9-19.14): issued documents. PDFs are generated
-- on demand from these fields rather than stored as files, so the
-- structured record stays the single source of truth (spec 19.17:
-- "historical records cannot be permanently deleted").
-- certificate_number doubles as the public verification id (spec 19.12,
-- "Certificate Verification Foundation" per 25.4).
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_number VARCHAR(40) NOT NULL UNIQUE,
    conference_id INT NOT NULL,
    delegate_id INT NOT NULL,
    template_id INT NOT NULL,
    award_id INT NULL,
    certificate_type ENUM('participation', 'award', 'workshop_participation', 'custom') NOT NULL DEFAULT 'participation',
    issued_by_organizer_access_id INT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INT NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMP NULL,
    CONSTRAINT fk_certificates_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificates_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificates_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
    CONSTRAINT fk_certificates_award FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE SET NULL,
    CONSTRAINT fk_certificates_access FOREIGN KEY (issued_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Attendance/QR (25.4): one persistent check-in token per delegate,
-- redeemed against individual schedule_events.
-- ============================================
CREATE TABLE IF NOT EXISTS checkin_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL UNIQUE,
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_checkin_tokens_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_event_id INT NOT NULL,
    delegate_id INT NOT NULL,
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_by_organizer_access_id INT NULL,
    method ENUM('manual', 'qr_token') NOT NULL DEFAULT 'manual',
    CONSTRAINT fk_attendance_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_access FOREIGN KEY (checked_in_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL,
    UNIQUE KEY uq_attendance_event_delegate (schedule_event_id, delegate_id)
) ENGINE=InnoDB;

CREATE INDEX idx_awards_conference ON awards(conference_id);
CREATE INDEX idx_awards_delegate ON awards(delegate_id);
CREATE INDEX idx_cert_templates_org ON certificate_templates(organization_id);
CREATE INDEX idx_certificates_conference ON certificates(conference_id);
CREATE INDEX idx_certificates_delegate ON certificates(delegate_id);
CREATE INDEX idx_attendance_event ON attendance_records(schedule_event_id);
CREATE INDEX idx_attendance_delegate ON attendance_records(delegate_id);

-- ============================================
-- New capability: attendance check-in. Routes are conference-scoped (like
-- schedule management), not committee-scoped, so only owner/
-- conference_manager/organizer can reach them -- committee_director isn't
-- granted this key since no route would ever check it for that role.
-- ============================================
INSERT INTO permissions (`key`, label, module) VALUES
    ('manage_attendance', 'Manage attendance check-in', 'attendance')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO role_permissions (role, permission_key)
SELECT 'owner', 'manage_attendance' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'owner' AND permission_key = 'manage_attendance');

INSERT INTO role_permissions (role, permission_key)
SELECT 'conference_manager', 'manage_attendance' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'conference_manager' AND permission_key = 'manage_attendance');

INSERT INTO role_permissions (role, permission_key) VALUES
    ('organizer', 'manage_attendance')
ON DUPLICATE KEY UPDATE role = role;
