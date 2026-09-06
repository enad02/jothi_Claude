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

function eventInsideProtectedClosure(event, closures) {
  return closures.some((closure) => dateWithinClosure(event.date, closure));
}

function buildNormalSlot(teachingDate, batch) {
  const teaching = makeEvent(teachingDate, batch.teaching.start_time, batch.teaching.duration_hours);
  const revision = nextConfiguredEvent(teaching, batch.revision);
  const topicTest = nextConfiguredEvent(revision, batch.topic_test);
  return {
    teaching,
    revision,
    topic_test: topicTest,
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
    const intersectsClosure = [slot.teaching, slot.revision, slot.topic_test]
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

  const required = ["teaching", "revision", "topic_test"];
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
    const topicTest = accelerationEvent(override, "topic_test", programme.cycle_hours.topic_test);
    if (compareEvents(revision, teaching) <= 0 || compareEvents(topicTest, revision) <= 0) {
      errors.push("acceleration events must be in Teaching, Revision, Topic Test order");
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
      topic_test: accelerationEvent(override, "topic_test", programme.cycle_hours.topic_test),
      status: "Acceleration",
      break_id: override.break_id
    });
  }

  return { slots, errors };
}

export function calculateProgress(cycles, curriculum, programme) {
  const scheduledLessons = cycles.length;
  const coreTeachingHours = cycles.reduce((total, cycle) => total + cycle.teaching.duration_hours, 0);
  const revisionHours = cycles.reduce((total, cycle) => total + cycle.revision.duration_hours, 0);
  const topicTestHours = cycles.reduce((total, cycle) => total + cycle.topic_test.duration_hours, 0);
  const totalSupervisedHours = coreTeachingHours + revisionHours + topicTestHours;
  const finalCycle = cycles.at(-1);
  const forecastCompletionDate = finalCycle ? finalCycle.topic_test.date : null;

  return {
    lessons_scheduled: scheduledLessons,
    lessons_total: curriculum.sessions.length,
    core_teaching_hours: coreTeachingHours,
    core_teaching_hours_total: curriculum.sessions.reduce((total, lesson) => total + lesson.duration_hours, 0),
    revision_hours: revisionHours,
    revision_hours_total: curriculum.sessions.length * programme.cycle_hours.revision,
    topic_test_hours: topicTestHours,
    topic_test_hours_total: curriculum.sessions.length * programme.cycle_hours.topic_test,
    total_supervised_hours: totalSupervisedHours,
    total_supervised_hours_total: curriculum.sessions.length * (
      programme.cycle_hours.teaching + programme.cycle_hours.revision + programme.cycle_hours.topic_test
    ),
    forecast_completion_date: forecastCompletionDate,
    acceleration_cycles_used: cycles.filter((cycle) => cycle.status === "Acceleration").length,
    deadline_status: forecastCompletionDate && forecastCompletionDate <= programme.target_completion ? "On track" : "At risk"
  };
}

export function generateBatchSchedule(curriculum, programme, batch) {
  const lessonCount = curriculum.sessions.length;
  const acceleration = buildAccelerationSlots(batch, programme);
  const normalSlots = findNormalSlots(batch, programme, lessonCount);
  const slots = [...normalSlots, ...acceleration.slots]
    .sort((a, b) => compareEvents(a.teaching, b.teaching))
    .slice(0, lessonCount);

  const cycles = slots.map((slot, index) => ({
    cycle: index + 1,
    lesson_id: curriculum.sessions[index].lesson_id,
    title: curriculum.sessions[index].title,
    teaching: slot.teaching,
    revision: slot.revision,
    topic_test: slot.topic_test,
    status: slot.status,
    ...(slot.break_id ? { break_id: slot.break_id } : {})
  }));

  return {
    batch_id: batch.batch_id,
    name: batch.name,
    cycles,
    progress: calculateProgress(cycles, curriculum, programme),
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
