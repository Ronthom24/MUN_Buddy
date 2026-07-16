-- ============================================
-- MUN Buddy: Communication Center (Phase 6)
-- Version: 1.0
-- Run after 10_results_certificates_attendance.sql
--
-- Extends the existing Announcements/Resources modules (targeting, read
-- tracking, portfolio scope, tags, version history) and adds three fully
-- new modules per spec Chapter 15: FAQs, in-app Notifications, and Email
-- Broadcasts.
-- ============================================

USE mun_buddy;

-- ============================================
-- Announcements: finer-grained audience targeting beyond target_audience
-- ============================================
ALTER TABLE announcements
  ADD COLUMN committee_id INT NULL AFTER conference_id,
  ADD COLUMN portfolio_id INT NULL AFTER committee_id,
  ADD CONSTRAINT fk_announcements_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_announcements_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS announcement_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    delegate_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcement_reads_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_reads_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    UNIQUE KEY uq_announcement_reads (announcement_id, delegate_id)
) ENGINE=InnoDB;

-- ============================================
-- Resources: portfolio scope, tags, version history
-- ============================================
ALTER TABLE resources
  ADD COLUMN portfolio_id INT NULL AFTER committee_id,
  ADD COLUMN tags VARCHAR(255) NULL AFTER category,
  ADD COLUMN version INT NOT NULL DEFAULT 1 AFTER file_path,
  ADD CONSTRAINT fk_resources_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS resource_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    version INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(190),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resource_versions_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- FAQs (new module)
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    category ENUM('registration', 'committees', 'venue', 'accommodation', 'certificates', 'payments', 'schedule', 'resources', 'general')
        NOT NULL DEFAULT 'general',
    question TEXT NOT NULL,
    answer TEXT NULL,
    asked_by_delegate_id INT NULL,
    status ENUM('pending', 'answered', 'published', 'archived') NOT NULL DEFAULT 'pending',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    answered_by_access_id INT NULL,
    answered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_faqs_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_faqs_delegate FOREIGN KEY (asked_by_delegate_id) REFERENCES delegates(id) ON DELETE SET NULL,
    CONSTRAINT fk_faqs_answered_by FOREIGN KEY (answered_by_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_faqs_conference_status ON faqs(conference_id, status);

-- ============================================
-- Notifications (new module)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NULL,
    recipient_type ENUM('organizer', 'delegate') NOT NULL,
    recipient_id INT NOT NULL,
    type ENUM('info', 'reminder', 'warning', 'success', 'critical') NOT NULL DEFAULT 'info',
    title VARCHAR(190) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255) NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id, read_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_type ENUM('organizer', 'delegate') NOT NULL,
    recipient_id INT NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification_prefs (recipient_type, recipient_id)
) ENGINE=InnoDB;

-- ============================================
-- Email Broadcasts (new module)
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    subject VARCHAR(190) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_templates_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_broadcasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    subject VARCHAR(190) NOT NULL,
    body TEXT NOT NULL,
    audience ENUM('all', 'approved', 'committee', 'waitlisted', 'rejected') NOT NULL DEFAULT 'all',
    committee_id INT NULL,
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') NOT NULL DEFAULT 'draft',
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    created_by_access_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_broadcasts_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_email_broadcasts_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_broadcast_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broadcast_id INT NOT NULL,
    delegate_id INT NOT NULL,
    email VARCHAR(190) NOT NULL,
    status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message VARCHAR(255) NULL,
    CONSTRAINT fk_ebr_broadcast FOREIGN KEY (broadcast_id) REFERENCES email_broadcasts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ebr_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_email_broadcast_recipients_broadcast ON email_broadcast_recipients(broadcast_id, status);

-- ============================================
-- New permission keys for this phase's modules
-- ============================================
INSERT INTO permissions (`key`, label, module) VALUES
    ('answer_faqs', 'Answer & manage FAQs', 'communication'),
    ('send_broadcasts', 'Send email broadcasts', 'communication')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO role_permissions (role, permission_key)
SELECT 'owner', `key` FROM permissions WHERE `key` IN ('answer_faqs', 'send_broadcasts')
ON DUPLICATE KEY UPDATE role = role;

INSERT INTO role_permissions (role, permission_key)
SELECT 'conference_manager', `key` FROM permissions WHERE `key` IN ('answer_faqs', 'send_broadcasts')
ON DUPLICATE KEY UPDATE role = role;

INSERT INTO role_permissions (role, permission_key) VALUES
    ('organizer', 'answer_faqs'),
    ('committee_director', 'answer_faqs')
ON DUPLICATE KEY UPDATE role = role;
