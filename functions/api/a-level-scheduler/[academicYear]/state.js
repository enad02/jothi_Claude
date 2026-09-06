import { loadScheduleState, toScheduleApiState } from "../../../_lib/scheduler-db.js";
import { handleSchedulerRequest, jsonResponse, SchedulerHttpError } from "../../../_lib/scheduler-http.js";
import { assertAcademicYear } from "../../../_lib/scheduler-validation.js";

export async function onRequestGet(context) {
  return handleSchedulerRequest(context, async () => {
    const academicYear = context.params.academicYear;
    assertAcademicYear(academicYear);
    const state = await loadScheduleState(context.env.DB, academicYear);
    if (!state) {
      throw new SchedulerHttpError(404, "Schedule programme not found.");
    }
    return jsonResponse(toScheduleApiState(state));
  });
}
