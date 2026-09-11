CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(32) NOT NULL,
  rating SMALLINT,
  message TEXT NOT NULL,
  email VARCHAR(254),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_submissions_category_check
    CHECK (category IN ('Bug report', 'Feature request', 'General feedback', 'Other')),
  CONSTRAINT feedback_submissions_rating_check
    CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT feedback_submissions_message_length_check
    CHECK (char_length(message) BETWEEN 10 AND 5000)
);

CREATE INDEX IF NOT EXISTS feedback_submissions_created_at_idx
  ON feedback_submissions (created_at DESC);
