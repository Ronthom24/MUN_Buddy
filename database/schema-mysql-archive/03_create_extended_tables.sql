-- ============================================
-- MUN Buddy Extended Schema: Resolutions, Notes, Feedback
-- Version: 1.0
-- Run after 02_create_tables.sql
-- ============================================

USE mun_buddy;

-- ============================================
-- Resolutions (delegate drafts, organizer-reviewed)
-- ============================================
CREATE TABLE IF NOT EXISTS resolutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    committee_id INT NOT NULL,
    agenda_id INT,
    delegate_id INT NOT NULL,
    title VARCHAR(190) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('draft', 'submitted', 'under_review', 'passed', 'failed') NOT NULL DEFAULT 'draft',
    organizer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resolutions_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_resolutions_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    CONSTRAINT fk_resolutions_agenda FOREIGN KEY (agenda_id) REFERENCES agendas(id) ON DELETE SET NULL,
    CONSTRAINT fk_resolutions_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Notes (delegate personal notes)
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    title VARCHAR(190) NOT NULL,
    content TEXT,
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Feedback (delegate feedback about the conference)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    delegate_id INT NOT NULL,
    rating TINYINT,
    category ENUM('general', 'committee', 'logistics', 'other') NOT NULL DEFAULT 'general',
    comments TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT chk_feedback_rating CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
) ENGINE=InnoDB;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_resolutions_conference ON resolutions(conference_id);
CREATE INDEX idx_resolutions_delegate ON resolutions(delegate_id);
CREATE INDEX idx_notes_delegate ON notes(delegate_id);
CREATE INDEX idx_feedback_conference ON feedback(conference_id);
