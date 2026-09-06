import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { schedulerWritesAllowed } from "../functions/_lib/scheduler-write-guard.js";
import { toScheduleApiState } from "../functions/_lib/scheduler-db.js";
import {
  assertAccelerationInsideBreak,
  assertAcademicYear,
  validateAccelerationPayload,
  validateEventOverridePayload
} from "../functions/_lib/scheduler-validation.js";
import {
  eventOverridesFromApiState,
  programmeFromApiState
} from "../a-level-scheduler-state.js";

const baseline = JSON.parse(await readFile(new URL("../data/a-level-maths/2026-27.json", import.meta.url), "utf8"));
const curriculum = JSON.parse(await readFile(new URL("../data/a-level-maths/year12-curriculum.json", import.meta.url), "utf8"));

function databaseState() {
  return {
    programme: {
      id: "PROGRAMME-1",
      programme_id: "ALEVEL-MATHS-Y12",
      academic_year: "2026-27",
      taster_date: "2026-09-08",
      programme_start_date: "2026-09-14",
      target_completion_date: "2027-04-30",
      status: "On track",
      created_at: "2026-09-06T00:00:00Z",
      updated_at: "2026-09-06T00:00:00Z"
    },
    batches: [{
      id: "BATCH-DB-1",
      batch_key: "BATCH-1",
      display_name: "Batch 1",
      teaching_weekday: 1,
      teaching_start: "18:00",
      teaching_end: "20:00",
      revision_weekday: 4,
      revision_start: "18:00",
      revision_end: "19:00",
      topic_test_weekday: 5,
      topic_test_start: "19:00",
      topic_test_end: "20:00"
    }],
    breaks: [{
      id: "BREAK-DB-1",
      break_key: "christmas",
      display_name: "Christmas",
      start_date: "2026-12-21",
      end_date: "2027-01-03",
      acceleration_allowed: 1
    }],
    eventOverrides: [{
      id: "OVERRIDE-DB-1",
      batch_key: "BATCH-1",
      lesson_id: "Y12-01",
      event_type: "teaching",
      override_date: "2026-09-16",
      override_start: "18:00",
      override_end: "20:00",
      reason: "private staff note"
    }],
    accelerationCycles: []
  };
}

test("write guard denies by default and accepts only the exact local QA value", async () => {
  assert.equal(await schedulerWritesAllowed(undefined), false);
  assert.equal(await schedulerWritesAllowed("local-founder-qa "), false);
  assert.equal(await schedulerWritesAllowed("local-founder-qa"), true);
});

test("public state excludes database IDs, override reasons, actors, and audit history", () => {
  const publicState = toScheduleApiState(databaseState());
  const serialized = JSON.stringify(publicState);

  assert.equal(publicState.batches[0].event_overrides[0].lesson_id, "Y12-01");
  assert.doesNotMatch(serialized, /PROGRAMME-1|BATCH-DB-1|OVERRIDE-DB-1/);
  assert.doesNotMatch(serialized, /private staff note|actor|audit/i);
});

test("API state maps onto the Git baseline without duplicating curriculum records", () => {
  const apiState = toScheduleApiState(databaseState());
  const mapped = programmeFromApiState(apiState, baseline);
  const overrides = eventOverridesFromApiState(apiState);

  assert.equal(mapped.batches[0].teaching.weekday, "Monday");
  assert.equal(overrides[0].lesson_id, curriculum.sessions[0].lesson_id);
  assert.equal("lessons" in apiState, false);
  assert.equal("title" in apiState.batches[0].event_overrides[0], false);
});

test("server validation rejects unknown years, fields, lessons, event types, dates, and time ranges", () => {
  assert.throws(() => assertAcademicYear("2027-28"), (error) => error.status === 404);
  assert.throws(() => validateEventOverridePayload({
    batch_key: "BATCH-1",
    lesson_id: "Y12-29",
    event_type: "teaching",
    override_date: "2026-09-16",
    override_start: "18:00",
    override_end: "20:00"
  }), (error) => error.status === 404);
  assert.throws(() => validateEventOverridePayload({
    batch_key: "BATCH-1",
    lesson_id: "Y12-01",
    event_type: "lesson",
    override_date: "2026-02-30",
    override_start: "20:00",
    override_end: "18:00",
    unexpected: true
  }), (error) => error.status === 400);
});

test("acceleration validation requires ordered events inside the selected break", () => {
  const cycle = {
    batch_key: "BATCH-1",
    lesson_id: "Y12-15",
    break_key: "christmas",
    teaching: { date: "2026-12-22", start_time: "10:00", end_time: "12:00" },
    revision: { date: "2026-12-23", start_time: "10:00", end_time: "11:00" },
    topic_test: { date: "2026-12-24", start_time: "10:00", end_time: "11:00" },
    enabled: true
  };
  validateAccelerationPayload(cycle);
  assertAccelerationInsideBreak(cycle, { start_date: "2026-12-21", end_date: "2027-01-03" });
  assert.throws(() => assertAccelerationInsideBreak(
    { ...cycle, teaching: { ...cycle.teaching, date: "2026-12-20" } },
    { start_date: "2026-12-21", end_date: "2027-01-03" }
  ), (error) => error.status === 400);
});

test("local config contains placeholders only and never enables writes", async () => {
  const config = await readFile(new URL("../wrangler.scheduler.local.jsonc", import.meta.url), "utf8");
  const example = await readFile(new URL("../.dev.vars.example", import.meta.url), "utf8");
  const gitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");

  assert.match(config, /LOCAL DEVELOPMENT ONLY/);
  assert.match(config, /00000000-0000-4000-8000-00000000000[01]/);
  assert.doesNotMatch(config, /SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES/);
  assert.match(example, /^#.*\nSCHEDULER_ALLOW_UNAUTHENTICATED_WRITES=local-founder-qa\s*$/);
  assert.match(gitignore, /^\.dev\.vars$/m);
  assert.match(gitignore, /^\.wrangler\/$/m);
});
