PRAGMA foreign_keys = ON;

CREATE TABLE programme_instances (
  id TEXT PRIMARY KEY,
  programme_id TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  taster_date TEXT,
  programme_start_date TEXT NOT NULL,
  target_completion_date TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(programme_id, academic_year)
);

CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  programme_instance_id TEXT NOT NULL,
  batch_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  teaching_weekday INTEGER NOT NULL CHECK (teaching_weekday BETWEEN 0 AND 6),
  teaching_start TEXT NOT NULL,
  teaching_end TEXT NOT NULL,
  revision_weekday INTEGER NOT NULL CHECK (revision_weekday BETWEEN 0 AND 6),
  revision_start TEXT NOT NULL,
  revision_end TEXT NOT NULL,
  topic_test_weekday INTEGER NOT NULL CHECK (topic_test_weekday BETWEEN 0 AND 6),
  topic_test_start TEXT NOT NULL,
  topic_test_end TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(programme_instance_id, batch_key),
  FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE CASCADE
);

CREATE TABLE programme_breaks (
  id TEXT PRIMARY KEY,
  programme_instance_id TEXT NOT NULL,
  break_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  acceleration_allowed INTEGER NOT NULL DEFAULT 1 CHECK (acceleration_allowed IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(programme_instance_id, break_key),
  FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE CASCADE
);

CREATE TABLE event_overrides (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('teaching', 'revision', 'topic_test')),
  override_date TEXT NOT NULL,
  override_start TEXT NOT NULL,
  override_end TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(batch_id, lesson_id, event_type),
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

CREATE TABLE acceleration_cycles (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  break_key TEXT NOT NULL,
  teaching_date TEXT NOT NULL,
  teaching_start TEXT NOT NULL,
  teaching_end TEXT NOT NULL,
  revision_date TEXT NOT NULL,
  revision_start TEXT NOT NULL,
  revision_end TEXT NOT NULL,
  topic_test_date TEXT NOT NULL,
  topic_test_start TEXT NOT NULL,
  topic_test_end TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(batch_id, lesson_id),
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

CREATE TABLE schedule_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_batches_programme_instance
ON batches(programme_instance_id);

CREATE INDEX idx_programme_breaks_programme_instance
ON programme_breaks(programme_instance_id);

CREATE INDEX idx_event_overrides_batch
ON event_overrides(batch_id);

CREATE INDEX idx_acceleration_cycles_batch
ON acceleration_cycles(batch_id);

CREATE INDEX idx_schedule_audit_entity
ON schedule_audit_log(entity_type, entity_id);

PRAGMA optimize;
