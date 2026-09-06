import {
  loadBreaks,
  loadProgrammeInstance,
  loadScheduleState,
  toScheduleApiState,
  upsertProgrammeConfiguration
} from "../../../../_lib/scheduler-db.js";
import { handleSchedulerRequest, jsonResponse, readJsonBody, SchedulerHttpError } from "../../../../_lib/scheduler-http.js";
import { assertAcademicYear, validateProgrammePatch } from "../../../../_lib/scheduler-validation.js";
import { requireSchedulerWriteAccess } from "../../../../_lib/scheduler-write-guard.js";

export async function onRequestPatch(context) {
  return handleSchedulerRequest(context, async () => {
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    const actorIdentifier = requireSchedulerWriteAccess(context);
    const body = await readJsonBody(context.request);
    validateProgrammePatch(body);

    const programme = await loadProgrammeInstance(context.env.DB, academicYear);
    if (!programme) {
      throw new SchedulerHttpError(404, "Schedule programme not found.");
    }
    const currentBreaks = await loadBreaks(context.env.DB, programme.id);
    const breakByKey = new Map(currentBreaks.map((item) => [item.break_key, item]));
    if (new Set(body.breaks.map((item) => item.break_key)).size !== body.breaks.length) {
      throw new SchedulerHttpError(400, "Programme break keys must be unique.");
    }
    if (body.breaks.some((item) => !breakByKey.has(item.break_key))) {
      throw new SchedulerHttpError(404, "Programme break not found.");
    }

    await upsertProgrammeConfiguration(context.env.DB, programme, currentBreaks, body, actorIdentifier, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}
