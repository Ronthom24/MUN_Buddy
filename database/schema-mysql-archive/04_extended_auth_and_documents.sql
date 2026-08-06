-- ============================================
-- MUN Buddy: Multi-organizer auth, password reset, delegate documents
-- Version: 1.0
-- Run after 03_create_extended_tables.sql
-- ============================================

USE mun_buddy;

-- ============================================
-- Give organizer_access rows real login capability + committee scoping
-- ============================================
ALTER TABLE organizer_access
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN full_name VARCHAR(150) NULL,
  ADD COLUMN committee_id INT NULL,
  ADD CONSTRAINT fk_organizer_access_committee
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL;

-- ============================================
-- Password reset tokens (polymorphic: organizer/organizer_access/delegate accounts,
-- no FK on account_id since it points at different tables depending on account_type)
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_type ENUM('organizer', 'organizer_access', 'delegate') NOT NULL,
    account_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- Delegate documents (position papers / speeches)
-- ============================================
CREATE TABLE IF NOT EXISTS delegate_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    committee_id INT,
    agenda_id INT,
    type ENUM('position_paper', 'speech') NOT NULL,
    title VARCHAR(190) NOT NULL,
    content TEXT,
    status ENUM('draft', 'final') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL,
    CONSTRAINT fk_documents_agenda FOREIGN KEY (agenda_id) REFERENCES agendas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_password_reset_tokens_account ON password_reset_tokens(account_type, account_id);
CREATE INDEX idx_documents_delegate ON delegate_documents(delegate_id);
CREATE INDEX idx_organizer_access_committee ON organizer_access(committee_id);
