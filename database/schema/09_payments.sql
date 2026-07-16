-- ============================================
-- MUN Buddy: Payments & Finance Center (Phase 4)
-- Version: 1.0
-- Run after 08_schedule.sql
--
-- Spec Chapter 18: Version 1 supports manual/offline payment recording only
-- (cash, bank transfer, UPI, cheque) with organizer verification -- online
-- gateway integration (Razorpay/Stripe/etc.) is an explicit Future
-- Enhancement (18.5/18.17), not built here. The permission keys this phase
-- needs (verify_payments, manage_payments, view_financials) were already
-- seeded in 06_permissions.sql with role defaults anticipating this module:
-- owner/conference_manager get all three by default, organizer gets only
-- verify_payments, committee_director gets none -- unchanged here.
-- ============================================

USE mun_buddy;

-- ============================================
-- Payment configuration (spec 18.3): organizers opt a conference into
-- requiring payment and pick its currency. Individual fee line items live in
-- fee_categories below.
-- ============================================
ALTER TABLE conferences
  ADD COLUMN payment_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'INR';

-- ============================================
-- Fee Structure (spec 18.11): one or more named fee line items per
-- conference (registration/accommodation/merchandise/etc.), each flagged
-- required or optional.
-- ============================================
CREATE TABLE IF NOT EXISTS fee_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description TEXT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fee_categories_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Transaction Records (spec 18.9): every payment -- delegate self-reported or
-- organizer-recorded -- creates an immutable transaction row. Status
-- transitions (spec 18.7) track the manual verification workflow (18.6/18.8);
-- "Not Required" and "Pending" are derived at the API layer from the absence
-- of a row plus conferences.payment_required, rather than stored here.
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    delegate_id INT NOT NULL,
    fee_category_id INT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    method ENUM('cash', 'bank_transfer', 'upi', 'cheque', 'other') NOT NULL,
    transaction_reference VARCHAR(150) NULL,
    status ENUM('submitted', 'under_verification', 'verified', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'submitted',
    payment_date DATE NULL,
    notes TEXT NULL,
    recorded_by ENUM('delegate', 'organizer') NOT NULL DEFAULT 'delegate',
    created_by_organizer_access_id INT NULL,
    verified_by_organizer_access_id INT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_created_access FOREIGN KEY (created_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_verified_access FOREIGN KEY (verified_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Refund Management (spec 18.10): refunds never delete the original
-- transaction (18.16) -- they're a separate append-only record that also
-- flips the linked payment's status to 'refunded'.
-- ============================================
CREATE TABLE IF NOT EXISTS refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    conference_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    refund_date DATE NOT NULL,
    approved_by_organizer_access_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
    CONSTRAINT fk_refunds_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_access FOREIGN KEY (approved_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Discounts & Waivers (spec 18.12): flat-amount fee reductions, always
-- recorded with a reason, optionally scoped to one fee category.
-- ============================================
CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    delegate_id INT NOT NULL,
    fee_category_id INT NULL,
    type ENUM('early_bird', 'institution_discount', 'organizer_waiver', 'scholarship', 'promotional_code', 'other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    applied_by_organizer_access_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discounts_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    CONSTRAINT fk_discounts_delegate FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE,
    CONSTRAINT fk_discounts_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_discounts_access FOREIGN KEY (applied_by_organizer_access_id) REFERENCES organizer_access(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_fee_categories_conference ON fee_categories(conference_id);
CREATE INDEX idx_payments_conference ON payments(conference_id);
CREATE INDEX idx_payments_delegate ON payments(delegate_id);
CREATE INDEX idx_payments_status ON payments(conference_id, status);
CREATE INDEX idx_refunds_conference ON refunds(conference_id);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_discounts_conference ON discounts(conference_id);
CREATE INDEX idx_discounts_delegate ON discounts(delegate_id);
