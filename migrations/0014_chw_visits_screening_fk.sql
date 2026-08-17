-- Add nullable FK from chw_visits to benefits_screenings so a CHW visit
-- can be linked to a formal screening/case record. Walk-in / informal
-- visits keep client_display_name only (client_screening_id stays NULL).
ALTER TABLE chw_visits
  ADD COLUMN IF NOT EXISTS client_screening_id varchar(100)
    REFERENCES benefits_screenings(id);
