import { WEEKDAYS } from "./a-level-scheduler-engine.js";

export const PUBLIC_SCHEDULER_STATE_URL = "/api/a-level-scheduler/2026-27/state";
export const STAFF_SCHEDULER_API_ROOT = "/api/staff/a-level-scheduler/2026-27";
export const STAFF_SCHEDULER_STATE_URL = `${STAFF_SCHEDULER_API_ROOT}/state`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function minutes(time) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function durationHours(start, end) {
  return (minutes(end) - minutes(start)) / 60;
}

function endTime(start, duration) {
  const total = minutes(start) + Math.round(duration * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function recurringRuleFromState(rule) {
  return {
    weekday: WEEKDAYS[rule.weekday],
    start_time: rule.start_time,
    duration_hours: durationHours(rule.start_time, rule.end_time)
  };
}

export function programmeFromApiState(state, baselineProgramme) {
  const programme = clone(baselineProgramme);
  programme.programme_id = state.programme.programme_id;
  programme.academic_year = state.programme.academic_year;
  programme.taster_date = state.programme.taster_date;
  programme.programme_start = state.programme.programme_start_date;
  programme.target_completion = state.programme.target_completion_date;
  programme.status = state.programme.status;
  programme.closures = state.breaks.map((programmeBreak) => ({
    break_id: programmeBreak.break_key,
    label: programmeBreak.display_name,
    start_date: programmeBreak.start_date,
    end_date: programmeBreak.end_date,
    protected: true,
    optional_acceleration: "not_agreed"
  }));
  programme.batches = state.batches.map((batch) => ({
    batch_id: batch.batch_key,
    name: batch.display_name,
    teaching: recurringRuleFromState(batch.teaching),
    revision: recurringRuleFromState(batch.revision),
    topic_test: recurringRuleFromState(batch.topic_test),
    acceleration_overrides: batch.acceleration_cycles.map((cycle) => ({
      batch_id: batch.batch_key,
      lesson_id: cycle.lesson_id,
      break_id: cycle.break_key,
      enabled: cycle.enabled,
      teaching: { ...cycle.teaching },
      revision: { ...cycle.revision },
      topic_test: { ...cycle.topic_test }
    }))
  }));
  return programme;
}

export function eventOverridesFromApiState(state) {
  return state.batches.flatMap((batch) => batch.event_overrides.map((override) => ({
    batch_id: batch.batch_key,
    lesson_id: override.lesson_id,
    event_type: override.event_type,
    new_date: override.override_date,
    new_start_time: override.override_start,
    new_end_time: override.override_end
  })));
}

export function recurringRuleToApi(rule) {
  return {
    weekday: WEEKDAYS.indexOf(rule.weekday),
    start_time: rule.start_time,
    end_time: endTime(rule.start_time, rule.duration_hours)
  };
}

export async function loadSchedulerApiState(url, load = fetch) {
  const response = await load(url, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error("Schedule state could not be loaded.");
  }
  return response.json();
}

export async function requestSchedulerWrite(path, method, body, load = fetch) {
  const response = await load(`${STAFF_SCHEDULER_API_ROOT}/${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "The schedule change could not be saved.");
    error.status = response.status;
    throw error;
  }
  return payload;
}
