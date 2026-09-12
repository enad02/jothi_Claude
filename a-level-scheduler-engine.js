const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export const EVENT_TYPES = ["teaching", "revision"];

export const EVENT_LABELS = {
  teaching: "Teaching",
  revision: "Revision / Consolidation"
};

export const ASSESSMENT_TYPES = ["monthly_test", "mock_paper"];

function parseDate(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || "");
  if (!match) {
    throw new Error(`Invalid date: ${dateString || "missing"}`);
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (toIsoDate(date) !== dateString) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  return date;
}

function parseTime(timeString) {
  const match = /^(\d{2}):(\d{2})$/.exec(timeString || "");
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    throw new Error(`Invalid time: ${timeString || "missing"}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function compareEvents(a, b) {
  return `${a.date}T${a.start_time}`.localeCompare(`${b.date}T${b.start_time}`);
}

function addHours(time, hours) {
  const minutes = parseTime(time) + Math.round(hours * 60);
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

function makeEvent(date, startTime, durationHours) {
  parseDate(date);
  parseTime(startTime);
  return {
    date,
    start_time: startTime,
    end_time: addHours(startTime, durationHours),
    duration_hours: durationHours
  };
}

function durationHours(startTime, endTime) {
  return (parseTime(endTime) - parseTime(startTime)) / 60;
}

export function normaliseAssessmentEvent(event) {
  parseDate(event.date);
  parseTime(event.start_time);
  parseTime(event.end_time);
  if (!ASSESSMENT_TYPES.includes(event.assessment_type)) {
    throw new Error(`Invalid assessment type: ${event.assessment_type || "missing"}`);
  }
  const duration = durationHours(event.start_time, event.end_time);
  if (duration <= 0) {
    throw new Error(`Assessment end time must be after its start: ${event.assessment_key || event.label || "assessment"}`);
  }
  return {
    assessment_key: event.assessment_key,
    assessment_type: event.assessment_type,
    label: event.label,
    date: event.date,
    start_time: event.start_time,
    end_time: event.end_time,
    duration_hours: duration,
    ...(event.mock_cycle ? { mock_cycle: event.mock_cycle } : {}),
    ...(event.paper ? { paper: event.paper } : {}),
    ...(event.coverage_note ? { coverage_note: event.coverage_note } : {})
  };
}

function weekdayIndex(weekday) {
  const index = WEEKDAYS.indexOf(weekday);
  if (index === -1) {
    throw new Error(`Invalid weekday: ${weekday || "missing"}`);
  }
  return index;
}

function firstWeekdayOnOrAfter(dateString, weekday) {
  const date = parseDate(dateString);
  const daysAhead = (weekdayIndex(weekday) - date.getUTCDay() + 7) % 7;
  return toIsoDate(addDays(date, daysAhead));
}

function nextConfiguredEvent(previousEvent, definition) {
  let date = parseDate(previousEvent.date);
  const daysAhead = (weekdayIndex(definition.weekday) - date.getUTCDay() + 7) % 7;
  date = addDays(date, daysAhead);
  let event = makeEvent(toIsoDate(date), definition.start_time, definition.duration_hours);

  if (compareEvents(event, previousEvent) <= 0) {
    event = makeEvent(toIsoDate(addDays(date, 7)), definition.start_time, definition.duration_hours);
  }
  return event;
}

export function dateWithinClosure(dateString, closure) {
  return Boolean(
    closure.protected &&
    dateString >= closure.start_date &&
    dateString <= closure.end_date
  );
}

export function lessonPillLabel(cycle) {
  return cycle.title;
}

export function eventOverrideKey(override) {
  return `${override.batch_id}:${override.lesson_id}:${override.event_type}`;
}

export function upsertEventOverride(overrides, override) {
  const key = eventOverrideKey(override);
  return [...overrides.filter((item) => eventOverrideKey(item) !== key), { ...override }];
}

export function resetEventOverride(overrides, target) {
  const key = eventOverrideKey(target);
  return overrides.filter((item) => eventOverrideKey(item) !== key);
}

export function clearEventOverrides() {
  return [];
}

function applyOverrideToEvent(event, override) {
  return {
    ...event,
    date: override.new_date,
    start_time: override.new_start_time,
    end_time: override.new_end_time
  };
}

function findEventOverride(overrides, batchId, lessonId, eventType) {
  return overrides.find((override) => (
    override.batch_id === batchId &&
    override.lesson_id === lessonId &&
    override.event_type === eventType
  ));
}

function resolveCycleEvents(cycle, batchId, overrides) {
  const resolved = { ...cycle };
  for (const eventType of EVENT_TYPES) {
    const override = findEventOverride(overrides, batchId, cycle.lesson_id, eventType);
    resolved[eventType] = override
      ? applyOverrideToEvent(cycle[eventType], override)
      : { ...cycle[eventType] };
  }
  return resolved;
}

export function applyEventOverrides(schedule, curriculum, programme, overrides = []) {
  return {
    ...schedule,
    batches: schedule.batches.map((batch) => {
      const cycles = batch.cycles.map((cycle) => resolveCycleEvents(cycle, batch.batch_id, overrides));
      return {
        ...batch,
        cycles,
        progress: calculateProgress(cycles, curriculum, programme, batch.assessment_events || [])
      };
    })
  };
}

function eventStartsBefore(left, right) {
  return `${left.date}T${left.start_time}` < `${right.date}T${right.start_time}`;
}

function eventsOverlap(left, right) {
  return (
    left.date === right.date &&
    left.start_time < right.end_time &&
    right.start_time < left.end_time
  );
}

export function validateEventOverride(override, generatedSchedule, programme, currentOverrides = []) {
  const errors = [];
  const warnings = [];

  if (!override || !EVENT_TYPES.includes(override.event_type)) {
    return { errors: ["A valid event type is required."], warnings };
  }

  const generatedBatch = generatedSchedule.batches.find((batch) => batch.batch_id === override.batch_id);
  const generatedCycle = generatedBatch?.cycles.find((cycle) => cycle.lesson_id === override.lesson_id);
  if (!generatedBatch || !generatedCycle) {
    return { errors: ["The selected batch and lesson could not be found."], warnings };
  }

  if (Number(override.cycle) !== generatedCycle.cycle) {
    errors.push("The override cannot change lesson identity or sequence.");
  }

  try {
    parseDate(override.new_date);
    const startMinutes = parseTime(override.new_start_time);
    const endMinutes = parseTime(override.new_end_time);
    if (endMinutes <= startMinutes) {
      errors.push("End time must be after start time.");
    }
  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }

  const effectiveOverrides = upsertEventOverride(currentOverrides, override);
  const candidateEvent = applyOverrideToEvent(generatedCycle[override.event_type], override);

  for (const cycle of generatedBatch.cycles) {
    const resolvedCycle = resolveCycleEvents(cycle, generatedBatch.batch_id, effectiveOverrides);
    for (const eventType of EVENT_TYPES) {
      if (cycle.lesson_id === override.lesson_id && eventType === override.event_type) {
        continue;
      }
      if (eventsOverlap(candidateEvent, resolvedCycle[eventType])) {
        errors.push(`This event overlaps ${EVENT_LABELS[eventType]} for ${cycle.title}.`);
      }
    }
  }

  if ((programme.closures || []).some((closure) => dateWithinClosure(override.new_date, closure))) {
    warnings.push("This date is inside a protected programme break.");
  }

  const resolvedTargetCycle = resolveCycleEvents(generatedCycle, generatedBatch.batch_id, effectiveOverrides);
  if (eventStartsBefore(resolvedTargetCycle.revision, resolvedTargetCycle.teaching)) {
    warnings.push("Revision / Consolidation would take place before teaching.");
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function eventInsideProtectedClosure(event, closures) {
  return closures.some((closure) => dateWithinClosure(event.date, closure));
}

function buildNormalSlot(teachingDate, batch) {
  const teaching = makeEvent(teachingDate, batch.teaching.start_time, batch.teaching.duration_hours);
  const revision = nextConfiguredEvent(teaching, batch.revision);
  return {
    teaching,
    revision,
    status: "Scheduled"
  };
}

function findNormalSlots(batch, programme, count) {
  const closures = programme.closures || [];
  const slots = [];
  let teachingDate = firstWeekdayOnOrAfter(programme.programme_start, batch.teaching.weekday);
  let safetyCounter = 0;

  while (slots.length < count) {
    const slot = buildNormalSlot(teachingDate, batch);
    const intersectsClosure = [slot.teaching, slot.revision]
      .some((event) => eventInsideProtectedClosure(event, closures));

    if (!intersectsClosure) {
      slots.push(slot);
    }

    teachingDate = toIsoDate(addDays(parseDate(teachingDate), 7));
    safetyCounter += 1;
    if (safetyCounter > count + 520) {
      throw new Error(`Unable to generate schedule for ${batch.name || batch.batch_id}`);
    }
  }

  return slots;
}

function accelerationEvent(override, eventName, durationHours) {
  const value = override[eventName];
  if (!value || !value.date || !value.start_time) {
    return null;
  }
  return makeEvent(value.date, value.start_time, durationHours);
}

export function validateAccelerationOverride(override, batch, programme) {
  const errors = [];
  if (!override || !override.enabled) {
    return errors;
  }

  if (override.batch_id !== batch.batch_id) {
    errors.push("batch_id does not match the selected batch");
  }

  const closure = (programme.closures || []).find((item) => item.break_id === override.break_id);
  if (!closure) {
    errors.push("break_id does not match a configured closure");
  }

  const required = ["teaching", "revision"];
  for (const eventName of required) {
    const value = override[eventName];
    if (!value || !value.date || !value.start_time) {
      errors.push(`${eventName} date/time is required`);
      continue;
    }

    try {
      parseDate(value.date);
      parseTime(value.start_time);
    } catch (error) {
      errors.push(`${eventName}: ${error.message}`);
    }

    if (closure && (value.date < closure.start_date || value.date > closure.end_date)) {
      errors.push(`${eventName} must fall inside the ${closure.label} protected window`);
    }
  }

  if (errors.length === 0) {
    const teaching = accelerationEvent(override, "teaching", programme.cycle_hours.teaching);
    const revision = accelerationEvent(override, "revision", programme.cycle_hours.revision);
    if (compareEvents(revision, teaching) <= 0) {
      errors.push("acceleration events must be in Teaching, Revision / Consolidation order");
    }
  }

  return errors;
}

function buildAccelerationSlots(batch, programme) {
  const slots = [];
  const errors = [];

  for (const override of batch.acceleration_overrides || []) {
    if (!override.enabled) {
      continue;
    }

    const validationErrors = validateAccelerationOverride(override, batch, programme);
    if (validationErrors.length > 0) {
      errors.push(...validationErrors.map((message) => `${batch.name} ${override.break_id || "acceleration"}: ${message}`));
      continue;
    }

    slots.push({
      teaching: accelerationEvent(override, "teaching", programme.cycle_hours.teaching),
      revision: accelerationEvent(override, "revision", programme.cycle_hours.revision),
      status: "Acceleration",
      break_id: override.break_id
    });
  }

  return { slots, errors };
}

export function assessmentHours(assessmentEvents = []) {
  return assessmentEvents.reduce((total, event) => {
    const normalised = normaliseAssessmentEvent(event);
    return total + normalised.duration_hours;
  }, 0);
}

export function calculateProgress(cycles, curriculum, programme, assessmentEvents = []) {
  const scheduledLessons = cycles.length;
  const coreTeachingHours = cycles.reduce((total, cycle) => total + cycle.teaching.duration_hours, 0);
  const revisionHours = cycles.reduce((total, cycle) => total + cycle.revision.duration_hours, 0);
  const normalisedAssessments = assessmentEvents.map((event) => normaliseAssessmentEvent(event));
  const formalAssessmentHours = normalisedAssessments.reduce((total, event) => total + event.duration_hours, 0);
  const monthlyTestHours = normalisedAssessments
    .filter((event) => event.assessment_type === "monthly_test")
    .reduce((total, event) => total + event.duration_hours, 0);
  const midwayMockHours = normalisedAssessments
    .filter((event) => event.mock_cycle === "midway")
    .reduce((total, event) => total + event.duration_hours, 0);
  const finalMockHours = normalisedAssessments
    .filter((event) => event.mock_cycle === "final")
    .reduce((total, event) => total + event.duration_hours, 0);
  const totalSupervisedHours = coreTeachingHours + revisionHours + formalAssessmentHours;
  const finalCycle = cycles.at(-1);
  const scheduledDates = [
    ...(finalCycle ? [finalCycle.teaching.date, finalCycle.revision.date] : []),
    ...normalisedAssessments.map((event) => event.date)
  ];
  const forecastCompletionDate = scheduledDates.length
    ? scheduledDates.sort().at(-1)
    : null;

  return {
    lessons_scheduled: scheduledLessons,
    lessons_total: curriculum.sessions.length,
    core_teaching_hours: coreTeachingHours,
    core_teaching_hours_total: curriculum.sessions.reduce((total, lesson) => total + lesson.duration_hours, 0),
    revision_hours: revisionHours,
    revision_hours_total: curriculum.sessions.length * programme.cycle_hours.revision,
    monthly_test_hours: monthlyTestHours,
    midway_mock_hours: midwayMockHours,
    final_mock_hours: finalMockHours,
    formal_assessment_hours: formalAssessmentHours,
    formal_assessment_events: normalisedAssessments.length,
    total_supervised_hours: totalSupervisedHours,
    total_supervised_hours_total: totalSupervisedHours,
    forecast_completion_date: forecastCompletionDate,
    acceleration_cycles_used: cycles.filter((cycle) => cycle.status === "Acceleration").length,
    deadline_status: forecastCompletionDate && forecastCompletionDate <= programme.target_completion ? "On track" : "At risk"
  };
}

export function generateBatchSchedule(curriculum, programme, batch) {
  const lessonCount = curriculum.sessions.length;
  const acceleration = buildAccelerationSlots(batch, programme);
  const normalSlots = findNormalSlots(batch, programme, lessonCount);
  const assessmentEvents = (batch.assessment_events || []).map((event) => normaliseAssessmentEvent(event));
  const slots = [...normalSlots, ...acceleration.slots]
    .sort((a, b) => compareEvents(a.teaching, b.teaching))
    .slice(0, lessonCount);

  const cycles = slots.map((slot, index) => ({
    cycle: index + 1,
    lesson_id: curriculum.sessions[index].lesson_id,
    title: curriculum.sessions[index].title,
    teaching: slot.teaching,
    revision: slot.revision,
    status: slot.status,
    ...(slot.break_id ? { break_id: slot.break_id } : {})
  }));

  return {
    batch_id: batch.batch_id,
    name: batch.name,
    cycles,
    assessment_events: assessmentEvents.sort(compareEvents),
    progress: calculateProgress(cycles, curriculum, programme, assessmentEvents),
    errors: acceleration.errors
  };
}

export function generateSchedule(curriculum, programme) {
  if (curriculum.programme_id !== programme.programme_id) {
    throw new Error("Curriculum and programme IDs do not match");
  }

  const lessonIds = curriculum.sessions.map((lesson) => lesson.lesson_id);
  if (new Set(lessonIds).size !== lessonIds.length) {
    throw new Error("Curriculum lesson IDs must be unique");
  }

  return {
    programme_id: programme.programme_id,
    academic_year: programme.academic_year,
    batches: programme.batches.map((batch) => generateBatchSchedule(curriculum, programme, batch))
  };
}
