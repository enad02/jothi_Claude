import {
  deleteAccelerationCycle,
  loadAccelerationCycle,
  loadBatchByKey,
  loadBreakByKey,
  loadProgrammeInstance,
  loadScheduleState,
  toScheduleApiState,
  upsertAccelerationCycle
} from "../../../../_lib/scheduler-db.js";
import { handleSchedulerRequest, jsonResponse, readJsonBody, SchedulerHttpError } from "../../../../_lib/scheduler-http.js";
import {
  assertAcademicYear,
  assertAccelerationInsideBreak,
  validateAccelerationDeletePayload,
  validateAccelerationPayload
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
    const actorIdentifier = requireSchedulerWriteAccess(context);
    const body = await readJsonBody(context.request);
    validateAccelerationPayload(body);
    const { programme, batch } = await loadEntities(context, academicYear, body);
    const programmeBreak = await loadBreakByKey(context.env.DB, programme.id, body.break_key);
    if (!programmeBreak || programmeBreak.acceleration_allowed !== 1) {
      throw new SchedulerHttpError(404, "Programme break not found.");
    }
    assertAccelerationInsideBreak(body, programmeBreak);
    const before = await loadAccelerationCycle(context.env.DB, batch.id, body.lesson_id);
    await upsertAccelerationCycle(context.env.DB, batch, body, before, actorIdentifier, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}

export async function onRequestDelete(context) {
  return handleSchedulerRequest(context, async () => {
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    const actorIdentifier = requireSchedulerWriteAccess(context);
    const body = await readJsonBody(context.request);
    validateAccelerationDeletePayload(body);
    const { batch } = await loadEntities(context, academicYear, body);
    const before = await loadAccelerationCycle(context.env.DB, batch.id, body.lesson_id);
    if (!before) {
      throw new SchedulerHttpError(404, "Acceleration cycle not found.");
    }
    await deleteAccelerationCycle(context.env.DB, before, actorIdentifier, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}
