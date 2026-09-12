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
import { initialisePublicSchedule, renderPublicSchedule } from "../a-level-schedule-public.js";
import { renderScheduleView } from "../a-level-scheduler-view.js";

const curriculum = JSON.parse(await readFile(new URL("../data/a-level-maths/year12-curriculum.json", import.meta.url), "utf8"));
const programme = JSON.parse(await readFile(new URL("../data/a-level-maths/2026-27.json", import.meta.url), "utf8"));
const publicTemplate = await readFile(new URL("../a-level-year12-schedule.html", import.meta.url), "utf8");
const publicController = await readFile(new URL("../a-level-schedule-public.js", import.meta.url), "utf8");
const publicStateModule = await readFile(new URL("../a-level-scheduler-public-state.js", import.meta.url), "utf8");
const publicViewModule = await readFile(new URL("../a-level-scheduler-view.js", import.meta.url), "utf8");
const publicEngineModule = await readFile(new URL("../a-level-scheduler-engine.js", import.meta.url), "utf8");
const staffTemplate = await readFile(new URL("../a-level-year12-scheduler.html", import.meta.url), "utf8");
const staffController = await readFile(new URL("../a-level-scheduler.js", import.meta.url), "utf8");
const expectedIds = Array.from({ length: 28 }, (_, index) => `Y12-${String(index + 1).padStart(2, "0")}`);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function persistedState() {
  return {
    programme: {
      programme_id: programme.programme_id,
      academic_year: programme.academic_year,
      taster_date: programme.taster_date,
      programme_start_date: programme.programme_start,
      target_completion_date: programme.target_completion,
      status: programme.status
    },
    breaks: programme.closures.map((item) => ({
      break_key: item.break_id,
      display_name: item.label,
      start_date: item.start_date,
      end_date: item.end_date
    })),
    batches: programme.batches.map((item) => ({
      batch_key: item.batch_id,
      display_name: item.name,
      teaching: { weekday: 1 + programme.batches.indexOf(item), start_time: item.teaching.start_time, end_time: "20:00" },
      revision: { weekday: 4, start_time: item.revision.start_time, end_time: item.batch_id === "BATCH-1" ? "19:00" : "20:00" },
      topic_test: { weekday: 5, start_time: "19:00", end_time: "20:00" },
      event_overrides: [],
      assessment_events: [],
      acceleration_cycles: []
    }))
  };
}

function approvedAssessmentFixture() {
  return [
    { assessment_key: "october-monthly-test", assessment_type: "monthly_test", label: "October monthly Topic Test", date: "2026-10-16", start_time: "19:00", end_time: "20:00" },
    { assessment_key: "november-monthly-test", assessment_type: "monthly_test", label: "November monthly Topic Test", date: "2026-11-13", start_time: "19:00", end_time: "20:00" },
    { assessment_key: "december-monthly-test", assessment_type: "monthly_test", label: "December monthly Topic Test", date: "2026-12-11", start_time: "19:00", end_time: "20:00" },
    { assessment_key: "february-monthly-test", assessment_type: "monthly_test", label: "February monthly Topic Test", date: "2027-02-12", start_time: "19:00", end_time: "20:00" },
    { assessment_key: "march-monthly-test", assessment_type: "monthly_test", label: "March monthly Topic Test", date: "2027-03-12", start_time: "19:00", end_time: "20:00" },
    { assessment_key: "april-monthly-test", assessment_type: "monthly_test", label: "April monthly Topic Test", date: "2027-04-16", start_time: "19:00", end_time: "20:00" },
    { assessment_key: "midway-mock-paper-1", assessment_type: "mock_paper", label: "Midway Mock — Paper 1 Pure Mathematics", date: "2027-01-15", start_time: "18:00", end_time: "20:00", mock_cycle: "midway", paper: "paper_1_pure" },
    { assessment_key: "midway-mock-paper-2", assessment_type: "mock_paper", label: "Midway Mock — Paper 2 Statistics and Mechanics", date: "2027-01-16", start_time: "10:00", end_time: "11:15", mock_cycle: "midway", paper: "paper_2_statistics_mechanics" },
    { assessment_key: "final-mock-paper-1", assessment_type: "mock_paper", label: "Final Mock — Paper 1 Pure Mathematics", date: "2027-05-07", start_time: "18:00", end_time: "20:00", mock_cycle: "final", paper: "paper_1_pure" },
    { assessment_key: "final-mock-paper-2", assessment_type: "mock_paper", label: "Final Mock — Paper 2 Statistics and Mechanics", date: "2027-05-08", start_time: "10:00", end_time: "11:15", mock_cycle: "final", paper: "paper_2_statistics_mechanics" }
  ];
}

function programmeWithAssessments() {
  const withAssessments = clone(programme);
  for (const batch of withAssessments.batches) {
    batch.assessment_events = approvedAssessmentFixture();
  }
  return withAssessments;
}

function batch(result, batchId) {
  return result.batches.find((item) => item.batch_id === batchId);
}

function eventDates(cycle) {
  return [cycle.teaching.date, cycle.revision.date];
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

  assert.deepEqual(eventDates(batch1First), ["2026-09-14", "2026-09-17"]);
  assert.deepEqual(eventDates(batch2First), ["2026-09-15", "2026-09-17"]);
});

test("D: generates the exact final-cycle dates", () => {
  const result = generateSchedule(curriculum, programme);
  const batch1Final = batch(result, "BATCH-1").cycles.at(-1);
  const batch2Final = batch(result, "BATCH-2").cycles.at(-1);

  assert.deepEqual(eventDates(batch1Final), ["2027-04-26", "2027-04-29"]);
  assert.deepEqual(eventDates(batch2Final), ["2027-04-27", "2027-04-29"]);
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

test("H: recurring teaching and revision/consolidation hours are generated without weekly Topic Tests", () => {
  const result = generateSchedule(curriculum, programme);
  for (const generatedBatch of result.batches) {
    assert.equal(generatedBatch.progress.core_teaching_hours, 56);
    assert.equal(generatedBatch.progress.revision_hours, 28);
    assert.equal(generatedBatch.progress.formal_assessment_hours, 0);
    assert.equal(generatedBatch.progress.total_supervised_hours, 84);
    assert.equal(generatedBatch.cycles.some((cycle) => "topic_test" in cycle), false);
  }
});

test("approved assessment fixture totals 12.5 assessment hours and 96.5 supervised hours", () => {
  const result = generateSchedule(curriculum, programmeWithAssessments());
  for (const generatedBatch of result.batches) {
    const assessments = generatedBatch.assessment_events;
    assert.equal(assessments.filter((event) => event.assessment_type === "monthly_test").length, 6);
    assert.equal(assessments.filter((event) => event.assessment_type === "monthly_test").every((event) => event.duration_hours === 1), true);
    assert.equal(assessments.find((event) => event.assessment_key === "midway-mock-paper-1").duration_hours, 2);
    assert.equal(assessments.find((event) => event.assessment_key === "midway-mock-paper-2").duration_hours, 1.25);
    assert.equal(assessments.find((event) => event.assessment_key === "final-mock-paper-1").duration_hours, 2);
    assert.equal(assessments.find((event) => event.assessment_key === "final-mock-paper-2").duration_hours, 1.25);
    assert.equal(generatedBatch.progress.formal_assessment_hours, 12.5);
    assert.equal(generatedBatch.progress.monthly_test_hours, 6);
    assert.equal(generatedBatch.progress.midway_mock_hours, 3.25);
    assert.equal(generatedBatch.progress.final_mock_hours, 3.25);
    assert.equal(generatedBatch.progress.total_supervised_hours, 96.5);
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
    revision: { date: "2026-12-23", start_time: "10:00" }
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
    revision: { date: "", start_time: "" }
  });

  const generatedBatch = batch(generateSchedule(curriculum, invalidProgramme), "BATCH-1");
  assert.ok(generatedBatch.errors.some((error) => error.includes("revision date/time is required")));
  assert.equal(generatedBatch.progress.acceleration_cycles_used, 0);
  assert.equal(generatedBatch.progress.forecast_completion_date, "2027-04-29");
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
  assert.equal("topic_test" in displayedCycle, false);
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

test("Step 1A G/H: overrides preserve lesson order and event-derived supervised hours", () => {
  const generated = generateSchedule(curriculum, programme);
  const displayedBatch = batch(
    applyEventOverrides(generated, curriculum, programme, [teachingOverride()]),
    "BATCH-1"
  );

  assert.deepEqual(displayedBatch.cycles.map((cycle) => cycle.lesson_id), expectedIds);
  assert.equal(displayedBatch.progress.total_supervised_hours, 84);
  assert.equal(displayedBatch.progress.core_teaching_hours, 56);
  assert.equal(displayedBatch.progress.revision_hours, 28);
  assert.equal(displayedBatch.progress.formal_assessment_hours, 0);
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
  assert.ok(validation.warnings.includes("Revision / Consolidation would take place before teaching."));
});

test("Step 1A: forecast uses overridden dates from the final cycle", () => {
  const generated = generateSchedule(curriculum, programme);
  const displayed = applyEventOverrides(generated, curriculum, programme, [{
    batch_id: "BATCH-1",
    lesson_id: "Y12-28",
    cycle: 28,
    event_type: "revision",
    new_date: "2027-05-07",
    new_start_time: "18:00",
    new_end_time: "19:00"
  }]);

  assert.equal(batch(displayed, "BATCH-1").progress.forecast_completion_date, "2027-05-07");
  assert.equal(batch(displayed, "BATCH-1").progress.deadline_status, "At risk");
  assert.equal(batch(displayed, "BATCH-1").progress.total_supervised_hours, 84);
});

test("Step 1A L: regeneration clears all temporary event overrides", () => {
  const overrides = [teachingOverride()];
  const cleared = clearEventOverrides(overrides);
  assert.deepEqual(cleared, []);
});

test("Step 2A A/B/F: public rendering emits both batches with title-only lesson pills and ID metadata", () => {
  const result = generateSchedule(curriculum, programme);
  const html = renderPublicSchedule(result, programme, "BATCH-1");

  assert.match(html, /id="panel-BATCH-1"/);
  assert.match(html, /id="panel-BATCH-2"/);
  assert.match(html, />Batch 1<\/button>/);
  assert.match(html, />Batch 2<\/button>/);
  assert.match(html, /class="lesson-label" data-lesson-id="Y12-01">Algebra and functions<\/span>/);
  assert.doesNotMatch(html, />Y12-01 · Algebra and functions</);
});

test("Step 2A C: public event cells are plain text and initialise no editing affordance", () => {
  const html = renderPublicSchedule(generateSchedule(curriculum, programme), programme, "BATCH-1");
  const headerOrder = /<th scope="col">Cycle<\/th>\s*<th scope="col">Lesson<\/th>\s*<th scope="col">Teaching date\/time<\/th>\s*<th scope="col">Revision \/ consolidation date\/time<\/th>\s*<th scope="col">Status<\/th>/;

  assert.equal((html.match(/class="event-time-static"/g) || []).length, 112);
  assert.match(html, headerOrder);
  assert.doesNotMatch(html, /Topic Test date\/time/);
  assert.doesNotMatch(html, /LESSON PILL|lesson-pill/i);
  assert.doesNotMatch(html, /<span class="lesson-label"[^>]*>[^<]*<\/span>[^<]*<button/i);
  assert.doesNotMatch(html, /data-event-edit/);
  assert.doesNotMatch(html, /event-time-trigger/);
  assert.doesNotMatch(html, /aria-label="Edit /);
  assert.doesNotMatch(html, /override|rescheduled|Acceleration cycles used|Optional acceleration/i);
});

test("Step 2A D/E: public template contains no staff, configuration, editor, or regeneration controls", () => {
  assert.match(publicTemplate, /<meta name="robots" content="noindex,follow" \/>/);
  assert.match(publicTemplate, /src="a-level-schedule-public\.js"/);
  assert.doesNotMatch(publicTemplate, /staff-controls|scheduler-setup|event-editor/i);
  assert.doesNotMatch(publicTemplate, /generate|regenerate/i);
  assert.doesNotMatch(publicTemplate, /<form|<input|<select|<dialog/i);
  assert.doesNotMatch(publicTemplate, /a-level-scheduler\.js/);
});

test("Step 2A G: staff rendering retains editable event controls and staff template controls", () => {
  const html = renderScheduleView(generateSchedule(curriculum, programme), programme, "BATCH-1", {
    editableEvents: true,
    lessonColumnLabel: "Lesson",
    showAcceleration: true,
    showValidation: true
  });
  const headerOrder = /<th scope="col">Cycle<\/th>\s*<th scope="col">Lesson<\/th>\s*<th scope="col">Teaching date\/time<\/th>\s*<th scope="col">Revision \/ consolidation date\/time<\/th>\s*<th scope="col">Status<\/th>/;

  assert.equal((html.match(/data-event-edit/g) || []).length, 112);
  assert.match(html, headerOrder);
  assert.doesNotMatch(html, /Topic Test date\/time/);
  assert.doesNotMatch(html, /LESSON PILL|lesson-pill/i);
  assert.doesNotMatch(html, /<span class="lesson-label"[^>]*>[^<]*<\/span>[^<]*<button/i);
  assert.match(html, /aria-label="Edit teaching date and time for Algebra and functions"/);
  assert.match(staffTemplate, /class="staff-controls"/);
  assert.match(staffTemplate, /Generate \/ Regenerate Schedule/);
  assert.match(staffTemplate, /id="event-editor"/);
  assert.match(staffTemplate, /<meta name="robots" content="noindex,follow" \/>/);
  assert.match(staffController, /elements\.batchTabs\.addEventListener\("click"/);
  assert.match(staffController, /openEventEditor\(eventTrigger\)/);
  assert.match(staffController, /elements\.eventEditForm\.addEventListener\("submit"/);
  assert.match(staffController, /requestSchedulerWrite\("event-override", "PUT"/);
  assert.match(staffController, /requestSchedulerWrite\("event-override", "DELETE"/);
  assert.match(staffController, /loadSchedulerApiState\(STAFF_SCHEDULER_STATE_URL\)/);
  assert.match(staffController, /renderAccelerationEditors/);
});

test("Step 2A A/H/I: public and staff views share lesson sequence, engine output, and event-derived totals", () => {
  const result = generateSchedule(curriculum, programme);
  const beforeRender = clone(result);
  const publicHtml = renderPublicSchedule(result, programme, "BATCH-1");
  const staffHtml = renderScheduleView(result, programme, "BATCH-1", { editableEvents: true });
  const lessonIdPattern = /class="lesson-label" data-lesson-id="([^"]+)"/g;
  const publicIds = [...publicHtml.matchAll(lessonIdPattern)].map((match) => match[1]);
  const staffIds = [...staffHtml.matchAll(lessonIdPattern)].map((match) => match[1]);

  assert.deepEqual(result, beforeRender);
  assert.deepEqual(publicIds, [...expectedIds, ...expectedIds]);
  assert.deepEqual(staffIds, publicIds);
  assert.equal((publicHtml.match(/>84h<\/dd>/g) || []).length, 1);
  assert.equal((staffHtml.match(/>84h<\/dd>/g) || []).length, 1);
  assert.ok(result.batches.every((item) => item.progress.total_supervised_hours === 84));
});

test("public output contains explicit assessments only and no fake weekly Topic Tests", () => {
  const result = generateSchedule(curriculum, programmeWithAssessments());
  const html = renderPublicSchedule(result, programmeWithAssessments(), "BATCH-1");

  assert.match(html, /Assessment schedule/);
  assert.match(html, /October monthly Topic Test/);
  assert.match(html, /Midway Mock — Paper 1 Pure Mathematics/);
  assert.match(html, /Final Mock — Paper 2 Statistics and Mechanics/);
  assert.equal((html.match(/monthly Topic Test/g) || []).length, 12);
  assert.equal((html.match(/1h 15m/g) || []).length, 4);
  assert.doesNotMatch(html, /Topic Test date\/time/);
});

test("Step 2A J: the public application ships no protected resource data", () => {
  const html = renderPublicSchedule(generateSchedule(curriculum, programme), programme, "BATCH-1");
  const publicSurface = `${publicTemplate}\n${publicController}\n${html}`;

  assert.doesNotMatch(publicSurface, /classkick|zoom|tutor[ -]?cost|resource[_ -]?token/i);
  assert.doesNotMatch(publicController, /a-level-scheduler\.js/);
});

test("Step 2A K: the public dependency graph contains no staff write surface", () => {
  const publicGraph = `${publicController}\n${publicStateModule}\n${publicViewModule}\n${publicEngineModule}`;

  assert.match(publicController, /a-level-scheduler-public-state\.js/);
  assert.doesNotMatch(publicController, /a-level-scheduler-state\.js|requestSchedulerWrite|api\/staff\/a-level-scheduler/);
  assert.doesNotMatch(publicGraph, /api\/staff\/a-level-scheduler|requestSchedulerWrite|STAFF_SCHEDULER|api\/a-level\/me|identity\.user|audit/i);
});

test("Step 2A L: the public controller performs only the anonymous schedule GET", () => {
  assert.match(publicController, /PUBLIC_SCHEDULER_STATE_URL/);
  assert.match(publicStateModule, /PUBLIC_SCHEDULER_STATE_URL\s*=\s*"\/api\/a-level-scheduler\/2026-27\/state"/);
  assert.doesNotMatch(publicController, /fetch\([^)]*method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(publicController, /requestSchedulerWrite|STAFF_SCHEDULER|api\/a-level\/me|identity\.user|role\s*===|admin|editor|viewer/i);
});

test("Step 2A: public controller loads the shared sources and mounts the read-only schedule", async () => {
  const listeners = new Map();
  const requests = [];
  const batchTabs = {
    innerHTML: "",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    }
  };
  const error = { hidden: true, textContent: "" };
  const page = {
    querySelector(selector) {
      return selector === "#batch-tabs" ? batchTabs : error;
    }
  };
  const load = async (path) => {
    requests.push(path);
    return {
      ok: true,
      async json() {
        if (path.includes("curriculum")) return clone(curriculum);
        if (path.startsWith("/api/")) return persistedState();
        return clone(programme);
      }
    };
  };

  await initialisePublicSchedule(page, load);

  assert.ok(listeners.has("click"));
  assert.ok(listeners.has("keydown"));
  assert.ok(requests.includes("/api/a-level-scheduler/2026-27/state"));
  assert.match(batchTabs.innerHTML, /Programme commitment/);
  assert.match(batchTabs.innerHTML, /id="panel-BATCH-2"/);
  assert.doesNotMatch(batchTabs.innerHTML, /data-event-edit/);
  assert.equal(error.hidden, true);
  assert.equal(error.textContent, "");
});

test("Step 2B: public controller never renders stale baseline data when persisted state is unavailable", async () => {
  const batchTabs = { innerHTML: "", addEventListener() {} };
  const error = { hidden: true, textContent: "" };
  const page = {
    querySelector(selector) {
      return selector === "#batch-tabs" ? batchTabs : error;
    }
  };
  const load = async (path) => ({
    ok: !path.startsWith("/api/"),
    async json() {
      return clone(path.includes("curriculum") ? curriculum : programme);
    }
  });
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await initialisePublicSchedule(page, load);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(batchTabs.innerHTML, "");
  assert.equal(error.hidden, false);
  assert.equal(error.textContent, "Schedule information is temporarily unavailable.");
});
