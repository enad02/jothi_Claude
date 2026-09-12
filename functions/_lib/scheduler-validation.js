import { SchedulerHttpError } from "./scheduler-http.js";

export const SUPPORTED_ACADEMIC_YEAR = "2026-27";
export const EVENT_TYPES = ["teaching", "revision"];
export const ASSESSMENT_TYPES = ["monthly_test", "mock_paper"];

function fail(message, status = 400) {
  throw new SchedulerHttpError(status, message);
}

export function assertAcademicYear(academicYear) {
  if (academicYear !== SUPPORTED_ACADEMIC_YEAR) {
    fail("Schedule programme not found.", 404);
  }
}

export function assertOnlyFields(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    fail(`${label} contains unknown fields: ${unknown.join(", ")}.`);
  }
}

export function assertIsoDate(value, label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) {
    fail(`${label} must use YYYY-MM-DD format.`);
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== value) {
    fail(`${label} is not a valid date.`);
  }
}

export function timeMinutes(value, label) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    fail(`${label} must use 24-hour HH:MM format.`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function assertTimeRange(start, end, label) {
  if (timeMinutes(end, `${label} end`) <= timeMinutes(start, `${label} start`)) {
    fail(`${label} end must be after its start.`);
  }
}

export function assertKnownLessonId(lessonId) {
  const match = /^Y12-(\d{2})$/.exec(lessonId || "");
  const sequence = match ? Number(match[1]) : 0;
  if (sequence < 1 || sequence > 28) {
    fail("Lesson not found.", 404);
  }
}

function validateRecurringRule(rule, label) {
  if (!rule || Array.isArray(rule) || typeof rule !== "object") {
    fail(`${label} rule is required.`);
  }
  assertOnlyFields(rule, ["weekday", "start_time", "end_time"], `${label} rule`);
  if (!Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6) {
    fail(`${label} weekday must be an integer from 0 to 6.`);
  }
  assertTimeRange(rule.start_time, rule.end_time, label);
}

export function validateProgrammePatch(body) {
  assertOnlyFields(body, ["taster_date", "programme_start_date", "target_completion_date", "breaks"], "Programme update");
  assertIsoDate(body.taster_date, "Taster date");
  assertIsoDate(body.programme_start_date, "Programme start date");
  assertIsoDate(body.target_completion_date, "Target completion date");
  if (!Array.isArray(body.breaks) || body.breaks.length === 0) {
    fail("Programme breaks are required.");
  }
  for (const programmeBreak of body.breaks) {
    if (!programmeBreak || Array.isArray(programmeBreak) || typeof programmeBreak !== "object") {
      fail("Each programme break must be an object.");
    }
    assertOnlyFields(programmeBreak, ["break_key", "start_date", "end_date"], "Programme break");
    if (typeof programmeBreak.break_key !== "string" || !programmeBreak.break_key) {
      fail("Programme break key is required.");
    }
    assertIsoDate(programmeBreak.start_date, "Break start date");
    assertIsoDate(programmeBreak.end_date, "Break end date");
    if (programmeBreak.end_date < programmeBreak.start_date) {
      fail("Break end date must be on or after its start date.");
    }
  }
}

export function validateBatchPatch(body) {
  assertOnlyFields(body, ["batch_key", "teaching", "revision", "topic_test"], "Batch update");
  if (typeof body.batch_key !== "string" || !body.batch_key) {
    fail("Batch key is required.");
  }
  validateRecurringRule(body.teaching, "Teaching");
  validateRecurringRule(body.revision, "Revision / Consolidation");
  if (body.topic_test) {
    validateRecurringRule(body.topic_test, "Legacy Topic Test");
  }
}

export function validateEventOverridePayload(body) {
  assertOnlyFields(body, ["batch_key", "lesson_id", "event_type", "override_date", "override_start", "override_end"], "Event override");
  if (typeof body.batch_key !== "string" || !body.batch_key) {
    fail("Batch key is required.");
  }
  assertKnownLessonId(body.lesson_id);
  if (!EVENT_TYPES.includes(body.event_type)) {
    fail("Event type must be teaching or revision.");
  }
  assertIsoDate(body.override_date, "Override date");
  assertTimeRange(body.override_start, body.override_end, "Override");
}

export function validateEventOverrideDeletePayload(body) {
  assertOnlyFields(body, ["batch_key", "lesson_id", "event_type"], "Event override reset");
  if (typeof body.batch_key !== "string" || !body.batch_key) {
    fail("Batch key is required.");
  }
  assertKnownLessonId(body.lesson_id);
  if (!EVENT_TYPES.includes(body.event_type)) {
    fail("Event type must be teaching or revision.");
  }
}

function validateAccelerationEvent(value, label) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} event is required.`);
  }
  assertOnlyFields(value, ["date", "start_time", "end_time"], `${label} event`);
  assertIsoDate(value.date, `${label} date`);
  assertTimeRange(value.start_time, value.end_time, label);
}

export function validateAccelerationPayload(body) {
  assertOnlyFields(body, ["batch_key", "lesson_id", "break_key", "teaching", "revision", "topic_test", "enabled"], "Acceleration cycle");
  if (typeof body.batch_key !== "string" || !body.batch_key) {
    fail("Batch key is required.");
  }
  assertKnownLessonId(body.lesson_id);
  if (typeof body.break_key !== "string" || !body.break_key) {
    fail("Break key is required.");
  }
  if (body.enabled !== true) {
    fail("Enabled acceleration cycles must set enabled to true.");
  }
  validateAccelerationEvent(body.teaching, "Teaching");
  validateAccelerationEvent(body.revision, "Revision / Consolidation");
  if (body.topic_test) {
    validateAccelerationEvent(body.topic_test, "Legacy Topic Test");
  }
  const teaching = `${body.teaching.date}T${body.teaching.start_time}`;
  const revision = `${body.revision.date}T${body.revision.start_time}`;
  if (!(teaching < revision)) {
    fail("Acceleration events must be in Teaching, Revision / Consolidation order.");
  }
}

export function validateAccelerationDeletePayload(body) {
  assertOnlyFields(body, ["batch_key", "lesson_id"], "Acceleration cycle removal");
  if (typeof body.batch_key !== "string" || !body.batch_key) {
    fail("Batch key is required.");
  }
  assertKnownLessonId(body.lesson_id);
}

export function assertAccelerationInsideBreak(body, programmeBreak) {
  for (const [label, event] of [["Teaching", body.teaching], ["Revision / Consolidation", body.revision]]) {
    if (event.date < programmeBreak.start_date || event.date > programmeBreak.end_date) {
      fail(`${label} date must fall inside the selected programme break.`);
    }
  }
}
