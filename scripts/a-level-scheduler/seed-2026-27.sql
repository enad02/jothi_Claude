INSERT INTO programme_instances (
  id, programme_id, academic_year, taster_date, programme_start_date,
  target_completion_date, status, created_at, updated_at
) VALUES (
  'ALEVEL-MATHS-Y12:2026-27', 'ALEVEL-MATHS-Y12', '2026-27', '2026-09-08',
  '2026-09-14', '2027-05-31', 'active',
  '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
)
ON CONFLICT(programme_id, academic_year) DO UPDATE SET
  taster_date = excluded.taster_date,
  programme_start_date = excluded.programme_start_date,
  target_completion_date = excluded.target_completion_date,
  updated_at = excluded.updated_at;

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

INSERT INTO assessment_events (
  id, batch_id, assessment_key, assessment_type, label, assessment_date,
  start_time, end_time, mock_cycle, paper, coverage_note, created_at, updated_at
) VALUES
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:october-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'october-monthly-test', 'monthly_test', 'October monthly Topic Test',
    '2026-10-30', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:november-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'november-monthly-test', 'monthly_test', 'November monthly Topic Test',
    '2026-11-27', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:december-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'december-monthly-test', 'monthly_test', 'December monthly Topic Test',
    '2026-12-18', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:midway-mock-paper-1',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'midway-mock-paper-1', 'mock_paper', 'Midway Mock Paper 1',
    '2027-01-15', '19:00', '21:00', 'midway', 'paper_1_pure', 'Pure Mathematics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:midway-mock-paper-2',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'midway-mock-paper-2', 'mock_paper', 'Midway Mock Paper 2',
    '2027-01-22', '19:00', '20:15', 'midway', 'paper_2_statistics_mechanics', 'Statistics and Mechanics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:february-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'february-monthly-test', 'monthly_test', 'February monthly Topic Test',
    '2027-02-26', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:march-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'march-monthly-test', 'monthly_test', 'March monthly Topic Test',
    '2027-03-19', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:april-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'april-monthly-test', 'monthly_test', 'April monthly Topic Test',
    '2027-04-30', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:final-mock-paper-1',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'final-mock-paper-1', 'mock_paper', 'Final Mock Paper 1',
    '2027-05-14', '19:00', '21:00', 'final', 'paper_1_pure', 'Pure Mathematics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1:final-mock-paper-2',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-1',
    'final-mock-paper-2', 'mock_paper', 'Final Mock Paper 2',
    '2027-05-21', '19:00', '20:15', 'final', 'paper_2_statistics_mechanics', 'Statistics and Mechanics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:october-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'october-monthly-test', 'monthly_test', 'October monthly Topic Test',
    '2026-10-30', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:november-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'november-monthly-test', 'monthly_test', 'November monthly Topic Test',
    '2026-11-27', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:december-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'december-monthly-test', 'monthly_test', 'December monthly Topic Test',
    '2026-12-18', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:midway-mock-paper-1',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'midway-mock-paper-1', 'mock_paper', 'Midway Mock Paper 1',
    '2027-01-15', '19:00', '21:00', 'midway', 'paper_1_pure', 'Pure Mathematics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:midway-mock-paper-2',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'midway-mock-paper-2', 'mock_paper', 'Midway Mock Paper 2',
    '2027-01-22', '19:00', '20:15', 'midway', 'paper_2_statistics_mechanics', 'Statistics and Mechanics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:february-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'february-monthly-test', 'monthly_test', 'February monthly Topic Test',
    '2027-02-26', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:march-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'march-monthly-test', 'monthly_test', 'March monthly Topic Test',
    '2027-03-19', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:april-monthly-test',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'april-monthly-test', 'monthly_test', 'April monthly Topic Test',
    '2027-04-30', '19:00', '20:00', NULL, NULL, NULL,
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:final-mock-paper-1',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'final-mock-paper-1', 'mock_paper', 'Final Mock Paper 1',
    '2027-05-14', '19:00', '21:00', 'final', 'paper_1_pure', 'Pure Mathematics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  ),
  (
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2:final-mock-paper-2',
    'ALEVEL-MATHS-Y12:2026-27:BATCH-2',
    'final-mock-paper-2', 'mock_paper', 'Final Mock Paper 2',
    '2027-05-21', '19:00', '20:15', 'final', 'paper_2_statistics_mechanics', 'Statistics and Mechanics',
    '2026-09-06T00:00:00.000Z', '2026-09-06T00:00:00.000Z'
  )
ON CONFLICT(batch_id, assessment_key) DO NOTHING;

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
