import { SchedulerHttpError } from "./scheduler-http.js";

const LOCAL_WRITE_VALUE = "local-founder-qa";
export const LOCAL_SCHEDULER_ACTOR = LOCAL_WRITE_VALUE;

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

export function isLocalSchedulerHostname(request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export async function localSchedulerBypassAllowed(request, env) {
  return isLocalSchedulerHostname(request)
    && await schedulerWritesAllowed(env.SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES);
}

export function requireSchedulerWriteAccess(context) {
  const actorIdentifier = context.data?.schedulerActorIdentifier;
  if (typeof actorIdentifier !== "string" || actorIdentifier.trim() === "") {
    throw new SchedulerHttpError(403, "Scheduler writes are disabled.");
  }
  return actorIdentifier;
}
