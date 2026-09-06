import {
  deleteEventOverride,
  loadBatchByKey,
  loadEventOverride,
  loadProgrammeInstance,
  loadScheduleState,
  toScheduleApiState,
  upsertEventOverride
} from "../../../../_lib/scheduler-db.js";
import { handleSchedulerRequest, jsonResponse, readJsonBody, SchedulerHttpError } from "../../../../_lib/scheduler-http.js";
import {
  assertAcademicYear,
  validateEventOverrideDeletePayload,
  validateEventOverridePayload
} from "../../../../_lib/scheduler-validation.js";
import { requireSchedulerWriteAccess } from "../../../../_lib/scheduler-write-guard.js";

async function loadEntities(context, academicYear, body) {
  const programme = await loadProgrammeInstance(context.env.DB, academicYear);
  if (!programme) {
    throw new SchedulerHttpError(404, "Schedule programme not found.");
  }
  const batch = await loadBatchByKey(context.env.DB, programme.id, body.batch_key);
  if (!batch) {
    throw new SchedulerHttpError(404, "Schedule batch not found.");
  }
  return { programme, batch };
}

export async function onRequestPut(context) {
  return handleSchedulerRequest(context, async () => {
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    await requireSchedulerWriteAccess(context.env);
    const body = await readJsonBody(context.request);
    validateEventOverridePayload(body);
    const { batch } = await loadEntities(context, academicYear, body);
    const before = await loadEventOverride(context.env.DB, batch.id, body.lesson_id, body.event_type);
    await upsertEventOverride(context.env.DB, batch, body, before, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}

export async function onRequestDelete(context) {
  return handleSchedulerRequest(context, async () => {
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    await requireSchedulerWriteAccess(context.env);
    const body = await readJsonBody(context.request);
    validateEventOverrideDeletePayload(body);
    const { batch } = await loadEntities(context, academicYear, body);
    const before = await loadEventOverride(context.env.DB, batch.id, body.lesson_id, body.event_type);
    if (!before) {
      throw new SchedulerHttpError(404, "Event override not found.");
    }
    await deleteEventOverride(context.env.DB, before, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}
