import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generateSchedule } from "../a-level-scheduler-engine.js";

const curriculum = JSON.parse(await readFile(new URL("../data/a-level-maths/year12-curriculum.json", import.meta.url), "utf8"));
const programme = JSON.parse(await readFile(new URL("../data/a-level-maths/2026-27.json", import.meta.url), "utf8"));
const expectedIds = Array.from({ length: 28 }, (_, index) => `Y12-${String(index + 1).padStart(2, "0")}`);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function batch(result, batchId) {
  return result.batches.find((item) => item.batch_id === batchId);
}

function eventDates(cycle) {
  return [cycle.teaching.date, cycle.revision.date, cycle.topic_test.date];
}

function inRange(date, start, end) {
  return date >= start && date <= end;
}

test("A/B: generates 28 lessons for every configured batch", () => {
  const result = generateSchedule(curriculum, programme);
  assert.equal(batch(result, "BATCH-1").cycles.length, 28);
  assert.equal(batch(result, "BATCH-2").cycles.length, 28);
});

test("C: generates the exact first-cycle dates", () => {
  const result = generateSchedule(curriculum, programme);
  const batch1First = batch(result, "BATCH-1").cycles[0];
  const batch2First = batch(result, "BATCH-2").cycles[0];

  assert.deepEqual(eventDates(batch1First), ["2026-09-14", "2026-09-17", "2026-09-18"]);
  assert.deepEqual(eventDates(batch2First), ["2026-09-15", "2026-09-17", "2026-09-18"]);
});

test("D: generates the exact final-cycle dates", () => {
  const result = generateSchedule(curriculum, programme);
  const batch1Final = batch(result, "BATCH-1").cycles.at(-1);
  const batch2Final = batch(result, "BATCH-2").cycles.at(-1);

  assert.deepEqual(eventDates(batch1Final), ["2027-04-26", "2027-04-29", "2027-04-30"]);
  assert.deepEqual(eventDates(batch2Final), ["2027-04-27", "2027-04-29", "2027-04-30"]);
});

test("E/F: no normal event falls inside Christmas or Easter closures", () => {
  const result = generateSchedule(curriculum, programme);
  for (const generatedBatch of result.batches) {
    for (const cycle of generatedBatch.cycles.filter((item) => item.status === "Scheduled")) {
      for (const date of eventDates(cycle)) {
        assert.equal(inRange(date, "2026-12-21", "2027-01-03"), false, `${generatedBatch.name} ${date} is inside Christmas`);
        assert.equal(inRange(date, "2027-03-22", "2027-04-11"), false, `${generatedBatch.name} ${date} is inside Easter`);
      }
    }
  }
});

test("G: lesson IDs remain unique and in exact curriculum order per batch", () => {
  const result = generateSchedule(curriculum, programme);
  for (const generatedBatch of result.batches) {
    const actualIds = generatedBatch.cycles.map((cycle) => cycle.lesson_id);
    assert.deepEqual(actualIds, expectedIds);
    assert.equal(new Set(actualIds).size, 28);
  }
});

test("H: total supervised hours equal 112 per batch", () => {
  const result = generateSchedule(curriculum, programme);
  for (const generatedBatch of result.batches) {
    assert.equal(generatedBatch.progress.core_teaching_hours, 56);
    assert.equal(generatedBatch.progress.revision_hours, 28);
    assert.equal(generatedBatch.progress.topic_test_hours, 28);
    assert.equal(generatedBatch.progress.total_supervised_hours, 112);
  }
});

test("I: changing programme start changes dates without changing lesson identity or order", () => {
  const changedProgramme = clone(programme);
  changedProgramme.programme_start = "2026-09-21";
  const defaultBatch = batch(generateSchedule(curriculum, programme), "BATCH-1");
  const changedBatch = batch(generateSchedule(curriculum, changedProgramme), "BATCH-1");

  assert.notEqual(changedBatch.cycles[0].teaching.date, defaultBatch.cycles[0].teaching.date);
  assert.deepEqual(changedBatch.cycles.map((cycle) => cycle.lesson_id), expectedIds);
});

test("regeneration honours changed closure dates", () => {
  const changedProgramme = clone(programme);
  changedProgramme.closures[0].start_date = "2026-12-28";
  const defaultBatch = batch(generateSchedule(curriculum, programme), "BATCH-1");
  const changedBatch = batch(generateSchedule(curriculum, changedProgramme), "BATCH-1");

  assert.notEqual(changedBatch.progress.forecast_completion_date, defaultBatch.progress.forecast_completion_date);
  assert.deepEqual(changedBatch.cycles.map((cycle) => cycle.lesson_id), expectedIds);
});

test("J/K: Batch 1 acceleration advances only Batch 1 forecast", () => {
  const acceleratedProgramme = clone(programme);
  acceleratedProgramme.batches[0].acceleration_overrides.push({
    batch_id: "BATCH-1",
    break_id: "christmas",
    enabled: true,
    teaching: { date: "2026-12-22", start_time: "10:00" },
    revision: { date: "2026-12-23", start_time: "10:00" },
    topic_test: { date: "2026-12-24", start_time: "10:00" }
  });

  const defaultResult = generateSchedule(curriculum, programme);
  const acceleratedResult = generateSchedule(curriculum, acceleratedProgramme);
  const defaultBatch1 = batch(defaultResult, "BATCH-1");
  const defaultBatch2 = batch(defaultResult, "BATCH-2");
  const acceleratedBatch1 = batch(acceleratedResult, "BATCH-1");
  const acceleratedBatch2 = batch(acceleratedResult, "BATCH-2");

  assert.equal(acceleratedBatch1.progress.acceleration_cycles_used, 1);
  assert.ok(acceleratedBatch1.progress.forecast_completion_date < defaultBatch1.progress.forecast_completion_date);
  assert.equal(acceleratedBatch2.progress.forecast_completion_date, defaultBatch2.progress.forecast_completion_date);
  assert.deepEqual(acceleratedBatch2.cycles, defaultBatch2.cycles);
  assert.deepEqual(acceleratedBatch1.cycles.map((cycle) => cycle.lesson_id), expectedIds);
});

test("L: an incomplete enabled acceleration override is rejected and not scheduled", () => {
  const invalidProgramme = clone(programme);
  invalidProgramme.batches[0].acceleration_overrides.push({
    batch_id: "BATCH-1",
    break_id: "christmas",
    enabled: true,
    teaching: { date: "2026-12-22", start_time: "10:00" },
    revision: { date: "", start_time: "" },
    topic_test: { date: "2026-12-24", start_time: "10:00" }
  });

  const generatedBatch = batch(generateSchedule(curriculum, invalidProgramme), "BATCH-1");
  assert.ok(generatedBatch.errors.some((error) => error.includes("revision date/time is required")));
  assert.equal(generatedBatch.progress.acceleration_cycles_used, 0);
  assert.equal(generatedBatch.progress.forecast_completion_date, "2027-04-30");
});

test("M: scheduling does not require resource references or URLs", () => {
  const curriculumWithoutResources = clone(curriculum);
  for (const session of curriculumWithoutResources.sessions) {
    delete session.resource_refs;
  }

  const result = generateSchedule(curriculumWithoutResources, programme);
  assert.equal(batch(result, "BATCH-1").cycles.length, 28);
  assert.deepEqual(batch(result, "BATCH-1").cycles.map((cycle) => cycle.lesson_id), expectedIds);
});
