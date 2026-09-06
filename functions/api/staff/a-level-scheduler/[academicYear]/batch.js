import {
  loadBatchByKey,
  loadProgrammeInstance,
  loadScheduleState,
  toScheduleApiState,
  upsertBatchConfiguration
} from "../../../../_lib/scheduler-db.js";
import { handleSchedulerRequest, jsonResponse, readJsonBody, SchedulerHttpError } from "../../../../_lib/scheduler-http.js";
import { assertAcademicYear, validateBatchPatch } from "../../../../_lib/scheduler-validation.js";
import { requireSchedulerWriteAccess } from "../../../../_lib/scheduler-write-guard.js";

export async function onRequestPatch(context) {
  return handleSchedulerRequest(context, async () => {
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    await requireSchedulerWriteAccess(context.env);
    const body = await readJsonBody(context.request);
    validateBatchPatch(body);

    const programme = await loadProgrammeInstance(context.env.DB, academicYear);
    if (!programme) {
      throw new SchedulerHttpError(404, "Schedule programme not found.");
    }
    const batch = await loadBatchByKey(context.env.DB, programme.id, body.batch_key);
    if (!batch) {
      throw new SchedulerHttpError(404, "Schedule batch not found.");
    }

    await upsertBatchConfiguration(context.env.DB, batch, body, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}
