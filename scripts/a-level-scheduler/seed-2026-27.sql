INSERT INTO programme_instances (
  id, programme_id, academic_year, taster_date, programme_start_date,
  target_completion_date, status, created_at, updated_at
) VALUES (
  'ALEVEL-MATHS-Y12:2026-27', 'ALEVEL-MATHS-Y12', '2026-27', '2026-09-08',
  '2026-09-14', '2027-04-30', 'active',
  '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
)
ON CONFLICT(programme_id, academic_year) DO NOTHING;

INSERT INTO batches (
  id, programme_instance_id, batch_key, display_name,
  teaching_weekday, teaching_start, teaching_end,
  revision_weekday, revision_start, revision_end,
  topic_test_weekday, topic_test_start, topic_test_end,
  created_at, updated_at
) VALUES
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1', 'ALEVEL-MATHS-Y12:2026-27', 'BATCH-1', 'Batch 1',
    1, '18:00', '20:00', 4, '18:00', '19:00', 5, '19:00', '20:00',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2', 'ALEVEL-MATHS-Y12:2026-27', 'BATCH-2', 'Batch 2',
    2, '18:00', '20:00', 4, '19:00', '20:00', 5, '19:00', '20:00',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  )
ON CONFLICT(programme_instance_id, batch_key) DO NOTHING;

INSERT INTO programme_breaks (
  id, programme_instance_id, break_key, display_name, start_date, end_date,
  acceleration_allowed, created_at, updated_at
) VALUES
  (
    'ALEVEL-MATHS-Y12:2026-27:christmas', 'ALEVEL-MATHS-Y12:2026-27',
    'christmas', 'Christmas', '2026-12-21', '2027-01-03', 1,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:easter', 'ALEVEL-MATHS-Y12:2026-27',
    'easter', 'Easter', '2027-03-22', '2027-04-11', 1,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  )
ON CONFLICT(programme_instance_id, break_key) DO NOTHING;
