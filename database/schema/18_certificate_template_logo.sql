-- ============================================
-- Optional logo/seal image for certificate templates (organizer feedback:
-- "ability to load a design"). Rendered in the top of the certificate PDF
-- above the title if set. Uses the same storageService-resolved file path
-- pattern as resources -- see certificatePdf.js.
-- ============================================
ALTER TABLE certificate_templates
    ADD COLUMN logo_path VARCHAR(500) NULL;
