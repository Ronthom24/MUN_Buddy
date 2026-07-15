-- ============================================
-- MUN Buddy Core Schema
-- Version: 1.0
-- Run after 01_create_database.sql
-- ============================================

USE mun_buddy;

-- ============================================
-- Organizers (primary, login-capable account per conference)
-- ============================================
CREATE TABLE IF NOT EXISTS organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- Conferences
-- ============================================
CREATE TABLE IF NOT EXISTS conferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    name VARCHAR(190) NOT NULL,
    acronym VARCHAR(30),
    short_name VARCHAR(60),
    institution VARCHAR(190),
    location VARCHAR(190),
    website VARCHAR(255),
    description TEXT,
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    registration_status ENUM('open', 'closed', 'invite_only') NOT NULL DEFAULT 'closed',
    max_delegates INT,
    conference_code VARCHAR(40) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conferences_organizer FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Organizer Access (invited organizer emails per conference, informational)
-- ============================================
CREATE TABLE IF NOT EXISTS organizer_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    email VARCHAR(190) NOT NULL,
    role ENUM('owner', 'organizer', 'committee_director', 'conference_manager') NOT NULL DEFAULT 'organizer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organizer_access_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    UNIQUE KEY uq_organizer_access_conference_email (conference_id, email)
) ENGINE=InnoDB;

-- ============================================
-- Committees
-- ============================================
CREATE TABLE IF NOT EXISTS committees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    chair VARCHAR(150),
    vice_chair VARCHAR(150),
    capacity INT,
    type ENUM('standard', 'crisis') NOT NULL DEFAULT 'standard',
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_committees_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Agendas (belong to a committee)
-- ============================================
CREATE TABLE IF NOT EXISTS agendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    committee_id INT NOT NULL,
    title VARCHAR(190) NOT NULL,
    description TEXT,
    background_notes TEXT,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    publication_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_agendas_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Portfolios (country seat or named position within a committee)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    committee_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    type ENUM('country', 'position', 'observer') NOT NULL DEFAULT 'country',
    description TEXT,
    status ENUM('available', 'assigned') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_portfolios_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Delegates (applicants, login-capable, scoped to one conference)
-- ============================================
CREATE TABLE IF NOT EXISTS delegates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    school VARCHAR(190),
    grade VARCHAR(30),
    mun_experience ENUM('beginner', '1-3', '4-10', '10+') NOT NULL DEFAULT 'beginner',
    profile_text TEXT,
    special_notes TEXT,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_delegates_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    UNIQUE KEY uq_delegates_conference_email (conference_id, email)
) ENGINE=InnoDB;

-- ============================================
-- Delegate committee preferences (ranked 1-3)
-- ============================================
CREATE TABLE IF NOT EXISTS delegate_committee_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    committee_id INT NOT NULL,
    preference_rank TINYINT NOT NULL,
    CONSTRAINT fk_dcp_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_dcp_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    UNIQUE KEY uq_dcp_delegate_rank (delegate_id, preference_rank)
) ENGINE=InnoDB;

-- ============================================
-- Delegate country preferences (free text, ranked 1-3)
-- ============================================
CREATE TABLE IF NOT EXISTS delegate_country_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL,
    country_name VARCHAR(150) NOT NULL,
    preference_rank TINYINT NOT NULL,
    CONSTRAINT fk_dcop_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    UNIQUE KEY uq_dcop_delegate_rank (delegate_id, preference_rank)
) ENGINE=InnoDB;

-- ============================================
-- Assignments (delegate -> committee + portfolio, publish-gated)
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delegate_id INT NOT NULL UNIQUE,
    committee_id INT,
    portfolio_id INT,
    status ENUM('unassigned', 'assigned') NOT NULL DEFAULT 'unassigned',
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL,
    CONSTRAINT fk_assignments_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Resources (conference-wide or committee-scoped documents)
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    committee_id INT,
    title VARCHAR(190) NOT NULL,
    category ENUM('background_guide', 'research_paper', 'rules_of_procedure', 'conference_handbook', 'position_paper_guide', 'other') NOT NULL DEFAULT 'other',
    description TEXT,
    file_path VARCHAR(255),
    visibility ENUM('all', 'assigned', 'organizers') NOT NULL DEFAULT 'all',
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    download_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resources_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_resources_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Announcements
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    title VARCHAR(190) NOT NULL,
    category ENUM('general_update', 'registration', 'assignments', 'resources', 'committee_update', 'emergency_notice') NOT NULL DEFAULT 'general_update',
    target_audience ENUM('all', 'delegates', 'organizers', 'committee_staff') NOT NULL DEFAULT 'all',
    priority ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal',
    content TEXT NOT NULL,
    attachment_path VARCHAR(255),
    publish_date DATETIME,
    status ENUM('draft', 'scheduled', 'published') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Indexes for common lookups
-- ============================================
CREATE INDEX idx_committees_conference ON committees(conference_id);
CREATE INDEX idx_agendas_committee ON agendas(committee_id);
CREATE INDEX idx_portfolios_committee ON portfolios(committee_id);
CREATE INDEX idx_delegates_conference ON delegates(conference_id);
CREATE INDEX idx_resources_conference ON resources(conference_id);
CREATE INDEX idx_announcements_conference ON announcements(conference_id);
