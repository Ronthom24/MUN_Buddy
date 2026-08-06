-- ============================================
-- MUN Buddy: Email Verification
-- Version: 1.0
-- Run after 14_platform_admin.sql
--
-- Organizers and delegates must verify their email address (via a real
-- SMTP-delivered link) before they can log in. Existing rows are backfilled
-- to verified so already-seeded/demo accounts keep working without a
-- re-verification step; only NEW self-registrations are gated.
-- ============================================

USE mun_buddy;

ALTER TABLE organizers ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE delegates ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE organizers SET email_verified = TRUE;
UPDATE delegates SET email_verified = TRUE;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_type ENUM('organizer', 'delegate') NOT NULL,
    account_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_email_verification_tokens_account ON email_verification_tokens(account_type, account_id);
