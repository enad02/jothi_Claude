export const PROGRAMME_ID = "ALEVEL-MATHS-Y12";

function rows(result) {
  return result?.results || [];
}

export async function loadProgrammeInstance(db, academicYear) {
  return db.prepare(`
    SELECT id, programme_id, academic_year, taster_date, programme_start_date,
           target_completion_date, status, created_at, updated_at
    FROM programme_instances
    WHERE programme_id = ? AND academic_year = ?
  `).bind(PROGRAMME_ID, academicYear).first();
}

export async function loadBatches(db, programmeInstanceId) {
  const result = await db.prepare(`
    SELECT id, programme_instance_id, batch_key, display_name,
           teaching_weekday, teaching_start, teaching_end,
           revision_weekday, revision_start, revision_end,
           topic_test_weekday, topic_test_start, topic_test_end,
           created_at, updated_at
    FROM batches
    WHERE programme_instance_id = ?
    ORDER BY batch_key
  `).bind(programmeInstanceId).all();
  return rows(result);
}

export async function loadBreaks(db, programmeInstanceId) {
  const result = await db.prepare(`
    SELECT id, programme_instance_id, break_key, display_name, start_date, end_date,
           acceleration_allowed, created_at, updated_at
    FROM programme_breaks
    WHERE programme_instance_id = ?
    ORDER BY start_date, break_key
  `).bind(programmeInstanceId).all();
  return rows(result);
}

export async function loadEventOverrides(db, programmeInstanceId) {
  const result = await db.prepare(`
    SELECT b.batch_key, e.id, e.batch_id, e.lesson_id, e.event_type,
           e.override_date, e.override_start, e.override_end,
           e.reason, e.created_at, e.updated_at
    FROM event_overrides e
    INNER JOIN batches b ON b.id = e.batch_id
    WHERE b.programme_instance_id = ?
    ORDER BY b.batch_key, e.lesson_id, e.event_type
  `).bind(programmeInstanceId).all();
  return rows(result);
}

export async function loadAccelerationCycles(db, programmeInstanceId) {
  const result = await db.prepare(`
    SELECT b.batch_key, a.id, a.batch_id, a.lesson_id, a.break_key,
           a.teaching_date, a.teaching_start, a.teaching_end,
           a.revision_date, a.revision_start, a.revision_end,
           a.topic_test_date, a.topic_test_start, a.topic_test_end,
           a.enabled, a.created_at, a.updated_at
    FROM acceleration_cycles a
    INNER JOIN batches b ON b.id = a.batch_id
    WHERE b.programme_instance_id = ?
    ORDER BY b.batch_key, a.lesson_id
  `).bind(programmeInstanceId).all();
  return rows(result);
}

export async function loadAssessmentEvents(db, programmeInstanceId) {
  try {
    const result = await db.prepare(`
      SELECT b.batch_key, a.id, a.batch_id, a.assessment_key, a.assessment_type,
             a.label, a.assessment_date, a.start_time, a.end_time,
             a.mock_cycle, a.paper, a.coverage_note, a.created_at, a.updated_at
      FROM assessment_events a
      INNER JOIN batches b ON b.id = a.batch_id
      WHERE b.programme_instance_id = ?
      ORDER BY b.batch_key, a.assessment_date, a.start_time, a.assessment_key
    `).bind(programmeInstanceId).all();
    return rows(result);
  } catch (error) {
    if (String(error?.message || "").includes("assessment_events")) {
      return [];
    }
    throw error;
  }
}

export async function loadScheduleState(db, academicYear) {
  const programme = await loadProgrammeInstance(db, academicYear);
  if (!programme) {
    return null;
  }

  const [batchResult, breakResult, overrideResult, accelerationResult] = await db.batch([
    db.prepare(`
      SELECT id, programme_instance_id, batch_key, display_name,
             teaching_weekday, teaching_start, teaching_end,
             revision_weekday, revision_start, revision_end,
             topic_test_weekday, topic_test_start, topic_test_end,
             created_at, updated_at
      FROM batches WHERE programme_instance_id = ? ORDER BY batch_key
    `).bind(programme.id),
    db.prepare(`
      SELECT id, programme_instance_id, break_key, display_name, start_date, end_date,
             acceleration_allowed, created_at, updated_at
      FROM programme_breaks WHERE programme_instance_id = ? ORDER BY start_date, break_key
    `).bind(programme.id),
    db.prepare(`
      SELECT b.batch_key, e.id, e.batch_id, e.lesson_id, e.event_type,
             e.override_date, e.override_start, e.override_end,
             e.reason, e.created_at, e.updated_at
      FROM event_overrides e INNER JOIN batches b ON b.id = e.batch_id
      WHERE b.programme_instance_id = ? ORDER BY b.batch_key, e.lesson_id, e.event_type
    `).bind(programme.id),
    db.prepare(`
      SELECT b.batch_key, a.id, a.batch_id, a.lesson_id, a.break_key,
             a.teaching_date, a.teaching_start, a.teaching_end,
             a.revision_date, a.revision_start, a.revision_end,
             a.topic_test_date, a.topic_test_start, a.topic_test_end,
             a.enabled, a.created_at, a.updated_at
      FROM acceleration_cycles a INNER JOIN batches b ON b.id = a.batch_id
      WHERE b.programme_instance_id = ? ORDER BY b.batch_key, a.lesson_id
    `).bind(programme.id)
  ]);
  const assessmentEvents = await loadAssessmentEvents(db, programme.id);

  return {
    programme,
    batches: rows(batchResult),
    breaks: rows(breakResult),
    eventOverrides: rows(overrideResult),
    accelerationCycles: rows(accelerationResult),
    assessmentEvents
  };
}

export function toScheduleApiState(state) {
  return {
    programme: {
      programme_id: state.programme.programme_id,
      academic_year: state.programme.academic_year,
      taster_date: state.programme.taster_date,
      programme_start_date: state.programme.programme_start_date,
      target_completion_date: state.programme.target_completion_date,
      status: state.programme.status
    },
    batches: state.batches.map((batch) => ({
      batch_key: batch.batch_key,
      display_name: batch.display_name,
      teaching: {
        weekday: batch.teaching_weekday,
        start_time: batch.teaching_start,
        end_time: batch.teaching_end
      },
      revision: {
        weekday: batch.revision_weekday,
        start_time: batch.revision_start,
        end_time: batch.revision_end
      },
      topic_test: {
        weekday: batch.topic_test_weekday,
        start_time: batch.topic_test_start,
        end_time: batch.topic_test_end
      },
      event_overrides: state.eventOverrides
        .filter((item) => item.batch_key === batch.batch_key)
        .map((item) => ({
          lesson_id: item.lesson_id,
          event_type: item.event_type,
          override_date: item.override_date,
          override_start: item.override_start,
          override_end: item.override_end
        })),
      assessment_events: (state.assessmentEvents || [])
        .filter((item) => item.batch_key === batch.batch_key)
        .map((item) => ({
          assessment_key: item.assessment_key,
          assessment_type: item.assessment_type,
          label: item.label,
          date: item.assessment_date,
          start_time: item.start_time,
          end_time: item.end_time,
          ...(item.mock_cycle ? { mock_cycle: item.mock_cycle } : {}),
          ...(item.paper ? { paper: item.paper } : {}),
          ...(item.coverage_note ? { coverage_note: item.coverage_note } : {})
        })),
      acceleration_cycles: state.accelerationCycles
        .filter((item) => item.batch_key === batch.batch_key && item.enabled === 1)
        .map((item) => ({
          lesson_id: item.lesson_id,
          break_key: item.break_key,
          teaching: { date: item.teaching_date, start_time: item.teaching_start, end_time: item.teaching_end },
          revision: { date: item.revision_date, start_time: item.revision_start, end_time: item.revision_end },
          enabled: true
        }))
    })),
    breaks: state.breaks.map((programmeBreak) => ({
      break_key: programmeBreak.break_key,
      display_name: programmeBreak.display_name,
      start_date: programmeBreak.start_date,
      end_date: programmeBreak.end_date
    }))
  };
}

export async function loadBatchByKey(db, programmeInstanceId, batchKey) {
  return db.prepare(`
    SELECT * FROM batches WHERE programme_instance_id = ? AND batch_key = ?
  `).bind(programmeInstanceId, batchKey).first();
}

export async function loadBreakByKey(db, programmeInstanceId, breakKey) {
  return db.prepare(`
    SELECT * FROM programme_breaks WHERE programme_instance_id = ? AND break_key = ?
  `).bind(programmeInstanceId, breakKey).first();
}

export async function loadEventOverride(db, batchId, lessonId, eventType) {
  return db.prepare(`
    SELECT * FROM event_overrides WHERE batch_id = ? AND lesson_id = ? AND event_type = ?
  `).bind(batchId, lessonId, eventType).first();
}

export async function loadAccelerationCycle(db, batchId, lessonId) {
  return db.prepare(`
    SELECT * FROM acceleration_cycles WHERE batch_id = ? AND lesson_id = ?
  `).bind(batchId, lessonId).first();
}

export async function loadAssessmentEvent(db, batchId, assessmentKey) {
  return db.prepare(`
    SELECT * FROM assessment_events WHERE batch_id = ? AND assessment_key = ?
  `).bind(batchId, assessmentKey).first();
}

function auditStatement(db, { actorIdentifier, action, entityType, entityId, before, after, timestamp }) {
  return db.prepare(`
    INSERT INTO schedule_audit_log (
      actor_identifier, action, entity_type, entity_id, before_json, after_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    actorIdentifier,
    action,
    entityType,
    entityId,
    before === null ? null : JSON.stringify(before),
    after === null ? null : JSON.stringify(after),
    timestamp
  );
}

export async function appendAuditRecord(db, record) {
  return auditStatement(db, record).run();
}

export async function upsertProgrammeConfiguration(db, current, currentBreaks, input, actorIdentifier, timestamp) {
  const breakByKey = new Map(currentBreaks.map((item) => [item.break_key, item]));
  const statements = [db.prepare(`
    INSERT INTO programme_instances (
      id, programme_id, academic_year, taster_date, programme_start_date,
      target_completion_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(programme_id, academic_year) DO UPDATE SET
      taster_date = excluded.taster_date,
      programme_start_date = excluded.programme_start_date,
      target_completion_date = excluded.target_completion_date,
      updated_at = excluded.updated_at
  `).bind(
    current.id, current.programme_id, current.academic_year, input.taster_date,
    input.programme_start_date, input.target_completion_date, current.status,
    current.created_at, timestamp
  )];

  for (const item of input.breaks) {
    const existing = breakByKey.get(item.break_key);
    statements.push(db.prepare(`
      UPDATE programme_breaks
      SET start_date = ?, end_date = ?, updated_at = ?
      WHERE id = ?
    `).bind(item.start_date, item.end_date, timestamp, existing.id));
  }

  const before = {
    taster_date: current.taster_date,
    programme_start_date: current.programme_start_date,
    target_completion_date: current.target_completion_date,
    breaks: currentBreaks.map((item) => ({ break_key: item.break_key, start_date: item.start_date, end_date: item.end_date }))
  };
  statements.push(auditStatement(db, {
    actorIdentifier,
    action: "programme.configuration.updated",
    entityType: "programme_instance",
    entityId: current.id,
    before,
    after: input,
    timestamp
  }));
  return db.batch(statements);
}

export async function upsertBatchConfiguration(db, current, input, actorIdentifier, timestamp) {
  const legacyTopicTest = input.topic_test || {
    weekday: current.topic_test_weekday,
    start_time: current.topic_test_start,
    end_time: current.topic_test_end
  };
  const after = {
    batch_key: current.batch_key,
    teaching: input.teaching,
    revision: input.revision,
    legacy_topic_test: legacyTopicTest
  };
  const before = {
    batch_key: current.batch_key,
    teaching: { weekday: current.teaching_weekday, start_time: current.teaching_start, end_time: current.teaching_end },
    revision: { weekday: current.revision_weekday, start_time: current.revision_start, end_time: current.revision_end },
    topic_test: { weekday: current.topic_test_weekday, start_time: current.topic_test_start, end_time: current.topic_test_end }
  };
  return db.batch([
    db.prepare(`
      INSERT INTO batches (
        id, programme_instance_id, batch_key, display_name,
        teaching_weekday, teaching_start, teaching_end,
        revision_weekday, revision_start, revision_end,
        topic_test_weekday, topic_test_start, topic_test_end,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(programme_instance_id, batch_key) DO UPDATE SET
        teaching_weekday = excluded.teaching_weekday,
        teaching_start = excluded.teaching_start,
        teaching_end = excluded.teaching_end,
        revision_weekday = excluded.revision_weekday,
        revision_start = excluded.revision_start,
        revision_end = excluded.revision_end,
        topic_test_weekday = excluded.topic_test_weekday,
        topic_test_start = excluded.topic_test_start,
        topic_test_end = excluded.topic_test_end,
        updated_at = excluded.updated_at
    `).bind(
      current.id, current.programme_instance_id, current.batch_key, current.display_name,
      input.teaching.weekday, input.teaching.start_time, input.teaching.end_time,
      input.revision.weekday, input.revision.start_time, input.revision.end_time,
      legacyTopicTest.weekday, legacyTopicTest.start_time, legacyTopicTest.end_time,
      current.created_at, timestamp
    ),
    auditStatement(db, {
      actorIdentifier,
      action: "batch.configuration.updated",
      entityType: "batch",
      entityId: current.id,
      before,
      after,
      timestamp
    })
  ]);
}

export async function upsertEventOverride(db, batch, input, before, actorIdentifier, timestamp) {
  const id = `${batch.id}:${input.lesson_id}:${input.event_type}`;
  const after = { ...input };
  await db.batch([
    db.prepare(`
      INSERT INTO event_overrides (
        id, batch_id, lesson_id, event_type, override_date, override_start,
        override_end, reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
      ON CONFLICT(batch_id, lesson_id, event_type) DO UPDATE SET
        override_date = excluded.override_date,
        override_start = excluded.override_start,
        override_end = excluded.override_end,
        reason = NULL,
        updated_at = excluded.updated_at
    `).bind(
      id, batch.id, input.lesson_id, input.event_type, input.override_date,
      input.override_start, input.override_end, before?.created_at || timestamp, timestamp
    ),
    auditStatement(db, {
      actorIdentifier,
      action: before ? "event_override.updated" : "event_override.created",
      entityType: "event_override",
      entityId: id,
      before,
      after,
      timestamp
    })
  ]);
  return id;
}

export async function deleteEventOverride(db, before, actorIdentifier, timestamp) {
  await db.batch([
    db.prepare("DELETE FROM event_overrides WHERE id = ?").bind(before.id),
    auditStatement(db, {
      actorIdentifier,
      action: "event_override.deleted",
      entityType: "event_override",
      entityId: before.id,
      before,
      after: null,
      timestamp
    })
  ]);
}

export async function updateAssessmentEventDateTime(db, before, input, actorIdentifier, timestamp) {
  const after = {
    ...before,
    assessment_date: input.assessment_date,
    start_time: input.start_time,
    end_time: input.end_time,
    updated_at: timestamp
  };
  await db.batch([
    db.prepare(`
      UPDATE assessment_events
      SET assessment_date = ?, start_time = ?, end_time = ?, updated_at = ?
      WHERE id = ?
    `).bind(input.assessment_date, input.start_time, input.end_time, timestamp, before.id),
    auditStatement(db, {
      actorIdentifier,
      action: "assessment_event.updated",
      entityType: "assessment_event",
      entityId: before.id,
      before,
      after,
      timestamp
    })
  ]);
}

export async function upsertAccelerationCycle(db, batch, input, before, actorIdentifier, timestamp) {
  const id = `${batch.id}:${input.lesson_id}`;
  const after = { ...input };
  const legacyTopicTest = input.topic_test || (before ? {
    date: before.topic_test_date,
    start_time: before.topic_test_start,
    end_time: before.topic_test_end
  } : {
    date: input.revision.date,
    start_time: input.revision.end_time,
    end_time: input.revision.end_time
  });
  await db.batch([
    db.prepare(`
      INSERT INTO acceleration_cycles (
        id, batch_id, lesson_id, break_key,
        teaching_date, teaching_start, teaching_end,
        revision_date, revision_start, revision_end,
        topic_test_date, topic_test_start, topic_test_end,
        enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(batch_id, lesson_id) DO UPDATE SET
        break_key = excluded.break_key,
        teaching_date = excluded.teaching_date,
        teaching_start = excluded.teaching_start,
        teaching_end = excluded.teaching_end,
        revision_date = excluded.revision_date,
        revision_start = excluded.revision_start,
        revision_end = excluded.revision_end,
        topic_test_date = excluded.topic_test_date,
        topic_test_start = excluded.topic_test_start,
        topic_test_end = excluded.topic_test_end,
        enabled = 1,
        updated_at = excluded.updated_at
    `).bind(
      id, batch.id, input.lesson_id, input.break_key,
      input.teaching.date, input.teaching.start_time, input.teaching.end_time,
      input.revision.date, input.revision.start_time, input.revision.end_time,
      legacyTopicTest.date, legacyTopicTest.start_time, legacyTopicTest.end_time,
      before?.created_at || timestamp, timestamp
    ),
    auditStatement(db, {
      actorIdentifier,
      action: before ? "acceleration_cycle.updated" : "acceleration_cycle.created",
      entityType: "acceleration_cycle",
      entityId: id,
      before,
      after,
      timestamp
    })
  ]);
  return id;
}

export async function deleteAccelerationCycle(db, before, actorIdentifier, timestamp) {
  await db.batch([
    db.prepare("DELETE FROM acceleration_cycles WHERE id = ?").bind(before.id),
    auditStatement(db, {
      actorIdentifier,
      action: "acceleration_cycle.deleted",
      entityType: "acceleration_cycle",
      entityId: before.id,
      before,
      after: null,
      timestamp
    })
  ]);
}
