PRAGMA foreign_keys = ON;

CREATE TABLE assessment_events (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  assessment_key TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('monthly_test', 'mock_paper')),
  label TEXT NOT NULL,
  assessment_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  mock_cycle TEXT CHECK (mock_cycle IS NULL OR mock_cycle IN ('midway', 'final')),
  paper TEXT,
  coverage_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(batch_id, assessment_key),
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

CREATE INDEX idx_assessment_events_batch
ON assessment_events(batch_id);

CREATE INDEX idx_assessment_events_date
ON assessment_events(assessment_date, start_time);

PRAGMA optimize;
