-- ============================================
-- MUN Buddy: Team Center + Public Website (Phase 7)
-- Version: 1.0
-- Run after 11_communication_center.sql
-- ============================================

USE mun_buddy;

-- ============================================
-- Departments (Team Center groups organizer_access rows)
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_departments_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    UNIQUE KEY uq_departments_conference_name (conference_id, name)
) ENGINE=InnoDB;

ALTER TABLE organizer_access
  ADD COLUMN department_id INT NULL AFTER committee_id,
  ADD COLUMN position_title VARCHAR(150) NULL AFTER department_id,
  ADD CONSTRAINT fk_organizer_access_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ============================================
-- Team activity feed (lightweight; full compliance audit log is Phase 8)
-- ============================================
CREATE TABLE IF NOT EXISTS team_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    actor_email VARCHAR(190) NOT NULL,
    actor_name VARCHAR(150) NULL,
    action VARCHAR(190) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_activity_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_team_activity_conference ON team_activity(conference_id, created_at);

-- ============================================
-- Public Website: opt-out listing flags + pretty conference slug
-- ============================================
ALTER TABLE organizations
  ADD COLUMN is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE AFTER status;

ALTER TABLE conferences
  ADD COLUMN is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE AFTER status,
  ADD COLUMN slug VARCHAR(120) NULL AFTER conference_code;

UPDATE conferences
SET slug = LOWER(REPLACE(REPLACE(REPLACE(conference_code, ' ', '-'), '_', '-'), '/', '-'))
WHERE slug IS NULL;

ALTER TABLE conferences ADD UNIQUE KEY uq_conferences_slug (slug);
