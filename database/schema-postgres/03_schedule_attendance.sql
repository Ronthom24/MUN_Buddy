-- ============================================
-- Schedule
-- ============================================
CREATE TABLE IF NOT EXISTS conference_schedule_days (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conference_id, day_date)
);
CREATE INDEX idx_csd_conference ON conference_schedule_days(conference_id);

CREATE TABLE IF NOT EXISTS schedule_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    schedule_day_id BIGINT NOT NULL REFERENCES conference_schedule_days(id) ON DELETE CASCADE,
    committee_id BIGINT REFERENCES committees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general_event'
        CHECK (type IN ('committee_session', 'general_event', 'ceremony')),
    location TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'updated', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_se_day ON schedule_events(schedule_day_id);
CREATE TRIGGER trg_schedule_events_updated_at BEFORE UPDATE ON schedule_events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Attendance / check-in
-- ============================================
CREATE TABLE IF NOT EXISTS checkin_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegate_id BIGINT NOT NULL UNIQUE REFERENCES delegates(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    schedule_event_id BIGINT NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    delegate_id BIGINT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    checked_in_by_organizer_access_id BIGINT REFERENCES organizer_access(id) ON DELETE SET NULL,
    method TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'qr_token')),
    UNIQUE (schedule_event_id, delegate_id)
);
CREATE INDEX idx_attendance_event ON attendance_records(schedule_event_id);
CREATE INDEX idx_attendance_delegate ON attendance_records(delegate_id);
