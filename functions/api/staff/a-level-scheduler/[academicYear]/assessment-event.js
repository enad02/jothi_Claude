import {
  loadAssessmentEvent,
  loadBatchByKey,
  loadProgrammeInstance,
  loadScheduleState,
  toScheduleApiState,
  updateAssessmentEventDateTime
} from "../../../../_lib/scheduler-db.js";
import { handleSchedulerRequest, jsonResponse, readJsonBody, SchedulerHttpError } from "../../../../_lib/scheduler-http.js";
import { assertAcademicYear, validateAssessmentEventPatch } from "../../../../_lib/scheduler-validation.js";
import { requireSchedulerWriteAccess } from "../../../../_lib/scheduler-write-guard.js";

export async function onRequestPatch(context) {
  return handleSchedulerRequest(context, async () => {
    const actorIdentifier = requireSchedulerWriteAccess(context, "event_override");
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    const body = await readJsonBody(context.request);
    validateAssessmentEventPatch(body);

    const programme = await loadProgrammeInstance(context.env.DB, academicYear);
    if (!programme) {
      throw new SchedulerHttpError(404, "Schedule programme not found.");
    }
    const batch = await loadBatchByKey(context.env.DB, programme.id, body.batch_key);
    if (!batch) {
      throw new SchedulerHttpError(404, "Schedule batch not found.");
    }
    const assessment = await loadAssessmentEvent(context.env.DB, batch.id, body.assessment_key);
    if (!assessment) {
      throw new SchedulerHttpError(404, "Assessment event not found.");
    }

    await updateAssessmentEventDateTime(context.env.DB, assessment, body, actorIdentifier, new Date().toISOString());
    const state = await loadScheduleState(context.env.DB, academicYear);
    return jsonResponse(toScheduleApiState(state));
  });
}
