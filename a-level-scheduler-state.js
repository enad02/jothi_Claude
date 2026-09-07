import { WEEKDAYS } from "./a-level-scheduler-engine.js";
export {
  PUBLIC_SCHEDULER_STATE_URL,
  eventOverridesFromApiState,
  loadSchedulerApiState,
  programmeFromApiState
} from "./a-level-scheduler-public-state.js";

export const STAFF_SCHEDULER_API_ROOT = "/api/staff/a-level-scheduler/2026-27";
export const STAFF_SCHEDULER_STATE_URL = `${STAFF_SCHEDULER_API_ROOT}/state`;

function minutes(time) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function endTime(start, duration) {
  const total = minutes(start) + Math.round(duration * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function recurringRuleToApi(rule) {
  return {
    weekday: WEEKDAYS.indexOf(rule.weekday),
    start_time: rule.start_time,
    end_time: endTime(rule.start_time, rule.duration_hours)
  };
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
