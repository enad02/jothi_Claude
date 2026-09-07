import { jsonResponse } from "../../_lib/scheduler-http.js";

export function onRequestGet(context) {
  const principal = context.data?.aLevelPrincipal;
  if (!principal) {
    return jsonResponse({ error: "A-Level access is not authorised." }, 403);
  }

  return jsonResponse({
    user: {
      code: principal.code,
      label: principal.label,
      role: principal.role
    }
  });
}
