-- ============================================
-- MUN Buddy: Schedule Management (Phase 3, spec Ch.10/12)
-- Version: 1.0
-- Run after 07_registration_and_assignment.sql
-- ============================================

USE mun_buddy;

CREATE TABLE IF NOT EXISTS conference_schedule_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    day_date DATE NOT NULL,
    label VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_csd_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    UNIQUE KEY uq_csd_conference_date (conference_id, day_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schedule_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_day_id INT NOT NULL,
    committee_id INT NULL,
    title VARCHAR(190) NOT NULL,
    type ENUM('committee_session', 'general_event', 'ceremony') NOT NULL DEFAULT 'general_event',
    location VARCHAR(190),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'updated', 'cancelled') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_se_day FOREIGN KEY (schedule_day_id) REFERENCES conference_schedule_days(id) ON DELETE CASCADE,
    CONSTRAINT fk_se_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_csd_conference ON conference_schedule_days(conference_id);
CREATE INDEX idx_se_day ON schedule_events(schedule_day_id);
