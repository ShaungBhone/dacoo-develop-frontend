CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  company VARCHAR(160),
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  team_size VARCHAR(20) NOT NULL,
  industry VARCHAR(120),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_submissions_message_length CHECK (char_length(message) BETWEEN 10 AND 5000)
);

CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON contact_submissions (created_at DESC);
