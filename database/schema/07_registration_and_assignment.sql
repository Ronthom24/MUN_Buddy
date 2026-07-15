-- ============================================
-- MUN Buddy: Registration Management + Delegate Assignment (Phase 2)
-- Version: 1.0
-- Run after 06_permissions.sql
-- ============================================

USE mun_buddy;

-- ============================================
-- Delegate status lifecycle: add Waitlisted / Withdrawn (spec 11.13)
-- ============================================
ALTER TABLE delegates
  MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn') NOT NULL DEFAULT 'pending';

-- ============================================
-- Registration configuration (spec 5.12)
-- ============================================
ALTER TABLE conferences
  ADD COLUMN waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN allow_reapplication BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- Custom Registration Forms (spec 11.5) -- one active form per conference,
-- organizer-defined extra fields on top of the fixed `delegates` columns.
-- ============================================
CREATE TABLE IF NOT EXISTS registration_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    schema_json JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_registration_forms_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS delegate_registration_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    form_id INT NOT NULL,
    responses_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_drr_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_drr_form FOREIGN KEY (form_id) REFERENCES registration_forms(id) ON DELETE CASCADE,
    UNIQUE KEY uq_drr_delegate (delegate_id)
) ENGINE=InnoDB;

-- ============================================
-- Assignment audit trail (spec 13.12): append-only log, separate from the
-- single current-state row in `assignments`.
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    committee_id INT NULL,
    portfolio_id INT NULL,
    action ENUM('assigned', 'reassigned', 'unassigned') NOT NULL,
    changed_by_organizer_access_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ah_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_ah_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL,
    CONSTRAINT fk_ah_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL,
    CONSTRAINT fk_ah_access FOREIGN KEY (changed_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_registration_forms_conference ON registration_forms(conference_id);
CREATE INDEX idx_ah_delegate ON assignment_history(delegate_id);
CREATE INDEX idx_delegates_status ON delegates(conference_id, status);
