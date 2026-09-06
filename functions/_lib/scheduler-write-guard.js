import { SchedulerHttpError } from "./scheduler-http.js";

const LOCAL_WRITE_VALUE = "local-founder-qa";

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function constantTimeEqual(left, right) {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] || 0) ^ (right[index] || 0);
  }
  return difference === 0;
}

export async function schedulerWritesAllowed(value) {
  const [providedHash, expectedHash] = await Promise.all([
    digest(typeof value === "string" ? value : ""),
    digest(LOCAL_WRITE_VALUE)
  ]);
  return constantTimeEqual(providedHash, expectedHash);
}

export async function requireSchedulerWriteAccess(env) {
  if (!await schedulerWritesAllowed(env.SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES)) {
    throw new SchedulerHttpError(403, "Scheduler writes are disabled.");
  }
}
