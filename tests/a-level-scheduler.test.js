import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyEventOverrides,
  clearEventOverrides,
  generateSchedule,
  lessonPillLabel,
  resetEventOverride,
  upsertEventOverride,
  validateEventOverride
} from "../a-level-scheduler-engine.js";

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

function teachingOverride(overrides = {}) {
  return {
    batch_id: "BATCH-1",
    lesson_id: "Y12-01",
    cycle: 1,
    event_type: "teaching",
    new_date: "2026-09-16",
    new_start_time: "17:00",
    new_end_time: "19:00",
    ...overrides
  };
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

test("Step 1A A/B: lesson pill label hides the stable ID while the record retains it", () => {
  const firstCycle = batch(generateSchedule(curriculum, programme), "BATCH-1").cycles[0];
  assert.equal(lessonPillLabel(firstCycle), "Algebra and functions");
  assert.equal(lessonPillLabel(firstCycle).includes("Y12-01"), false);
  assert.equal(firstCycle.lesson_id, "Y12-01");
});

test("Step 1A C/D: a teaching override changes only the selected teaching event", () => {
  const generated = generateSchedule(curriculum, programme);
  const originalCycle = batch(generated, "BATCH-1").cycles[0];
  const displayedCycle = batch(
    applyEventOverrides(generated, curriculum, programme, [teachingOverride()]),
    "BATCH-1"
  ).cycles[0];

  assert.deepEqual(displayedCycle.teaching, {
    ...originalCycle.teaching,
    date: "2026-09-16",
    start_time: "17:00",
    end_time: "19:00"
  });
  assert.deepEqual(displayedCycle.revision, originalCycle.revision);
  assert.deepEqual(displayedCycle.topic_test, originalCycle.topic_test);
});

test("Step 1A E: a Batch 1 event override does not affect Batch 2", () => {
  const generated = generateSchedule(curriculum, programme);
  const displayed = applyEventOverrides(generated, curriculum, programme, [teachingOverride()]);
  assert.deepEqual(batch(displayed, "BATCH-2"), batch(generated, "BATCH-2"));
});

test("Step 1A F: resetting an override restores the generated event", () => {
  const generated = generateSchedule(curriculum, programme);
  const override = teachingOverride();
  const withOverride = upsertEventOverride([], override);
  const afterReset = resetEventOverride(withOverride, override);
  const displayed = applyEventOverrides(generated, curriculum, programme, afterReset);

  assert.equal(afterReset.length, 0);
  assert.deepEqual(batch(displayed, "BATCH-1").cycles[0].teaching, batch(generated, "BATCH-1").cycles[0].teaching);
});

test("Step 1A G/H: overrides preserve lesson order and the 112-hour total", () => {
  const generated = generateSchedule(curriculum, programme);
  const displayedBatch = batch(
    applyEventOverrides(generated, curriculum, programme, [teachingOverride()]),
    "BATCH-1"
  );

  assert.deepEqual(displayedBatch.cycles.map((cycle) => cycle.lesson_id), expectedIds);
  assert.equal(displayedBatch.progress.total_supervised_hours, 112);
  assert.equal(displayedBatch.progress.core_teaching_hours, 56);
  assert.equal(displayedBatch.progress.revision_hours, 28);
  assert.equal(displayedBatch.progress.topic_test_hours, 28);
});

test("Step 1A I: an end time that is not after the start time is rejected", () => {
  const generated = generateSchedule(curriculum, programme);
  const validation = validateEventOverride(
    teachingOverride({ new_start_time: "19:00", new_end_time: "18:00" }),
    generated,
    programme
  );
  assert.ok(validation.errors.includes("End time must be after start time."));
});

test("Step 1A J: same-batch event overlap is rejected", () => {
  const generated = generateSchedule(curriculum, programme);
  const validation = validateEventOverride(
    teachingOverride({ new_date: "2026-09-17", new_start_time: "18:00", new_end_time: "20:00" }),
    generated,
    programme
  );
  assert.ok(validation.errors.some((error) => error.includes("overlaps Revision")));
});

test("Step 1A K: a protected-break date returns a warning rather than an error", () => {
  const generated = generateSchedule(curriculum, programme);
  const validation = validateEventOverride(
    teachingOverride({ new_date: "2026-12-22", new_start_time: "10:00", new_end_time: "12:00" }),
    generated,
    programme
  );
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.warnings.includes("This date is inside a protected programme break."));
});

test("Step 1A: moving revision before teaching returns a confirmation warning", () => {
  const generated = generateSchedule(curriculum, programme);
  const validation = validateEventOverride({
    batch_id: "BATCH-1",
    lesson_id: "Y12-01",
    cycle: 1,
    event_type: "revision",
    new_date: "2026-09-13",
    new_start_time: "18:00",
    new_end_time: "19:00"
  }, generated, programme);

  assert.deepEqual(validation.errors, []);
  assert.ok(validation.warnings.includes("Revision would take place before teaching."));
});

test("Step 1A: forecast uses overridden dates from the final cycle", () => {
  const generated = generateSchedule(curriculum, programme);
  const displayed = applyEventOverrides(generated, curriculum, programme, [{
    batch_id: "BATCH-1",
    lesson_id: "Y12-28",
    cycle: 28,
    event_type: "topic_test",
    new_date: "2027-05-07",
    new_start_time: "19:00",
    new_end_time: "20:00"
  }]);

  assert.equal(batch(displayed, "BATCH-1").progress.forecast_completion_date, "2027-05-07");
  assert.equal(batch(displayed, "BATCH-1").progress.deadline_status, "At risk");
  assert.equal(batch(displayed, "BATCH-1").progress.total_supervised_hours, 112);
});

test("Step 1A L: regeneration clears all temporary event overrides", () => {
  const overrides = [teachingOverride()];
  const cleared = clearEventOverrides(overrides);
  assert.deepEqual(cleared, []);
});
