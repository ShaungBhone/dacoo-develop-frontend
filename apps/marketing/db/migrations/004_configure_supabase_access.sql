ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE contact_submissions FROM anon, authenticated;
REVOKE ALL ON TABLE feedback_submissions FROM anon, authenticated;

GRANT INSERT ON TABLE contact_submissions TO service_role;
GRANT INSERT ON TABLE feedback_submissions TO service_role;
