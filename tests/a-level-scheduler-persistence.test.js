import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createSchedulerStaffMiddleware
} from "../functions/_lib/scheduler-access.js";
import {
  requireSchedulerWriteAccess,
  schedulerWritesAllowed
} from "../functions/_lib/scheduler-write-guard.js";
import { toScheduleApiState, upsertBatchConfiguration } from "../functions/_lib/scheduler-db.js";
import { onRequestGet as getPublicScheduleState } from "../functions/api/a-level-scheduler/[academicYear]/state.js";
import {
  assertAccelerationInsideBreak,
  assertAcademicYear,
  validateAccelerationPayload,
  validateEventOverridePayload
} from "../functions/_lib/scheduler-validation.js";
import {
  eventOverridesFromApiState,
  programmeFromApiState
} from "../a-level-scheduler-state.js";

const baseline = JSON.parse(await readFile(new URL("../data/a-level-maths/2026-27.json", import.meta.url), "utf8"));
const curriculum = JSON.parse(await readFile(new URL("../data/a-level-maths/year12-curriculum.json", import.meta.url), "utf8"));
const accessDomain = "https://jothi-test.cloudflareaccess.com";
const accessAudience = "scheduler-test-audience";

function staffContext(url, method = "GET", env = {}, next = async () => new Response("ok"), body) {
  const context = {
    request: new Request(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }),
    functionPath: "/api/staff/a-level-scheduler",
    env,
    data: {},
    params: {},
    next,
    waitUntil() {},
    passThroughOnException() {}
  };
  return context;
}

async function signedAccessFixture(payloadOverrides = {}) {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
  const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  Object.assign(publicKey, { kid: "scheduler-test-key", alg: "RS256", use: "sig" });
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: publicKey.kid })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: accessDomain,
    aud: [accessAudience],
    sub: "verified-human-id",
    email: "verified.staff@example.com",
    iat: Math.floor(Date.now() / 1000) - 10,
    exp: Math.floor(Date.now() / 1000) + 300,
    ...payloadOverrides
  })).toString("base64url");
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  return {
    jwt: `${header}.${payload}.${Buffer.from(signature).toString("base64url")}`,
    publicKey
  };
}

async function withAccessSigningKey(publicKey, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [publicKey] });
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function databaseState() {
  return {
    programme: {
      id: "PROGRAMME-1",
      programme_id: "ALEVEL-MATHS-Y12",
      academic_year: "2026-27",
      taster_date: "2026-09-08",
      programme_start_date: "2026-09-14",
      target_completion_date: "2027-04-30",
      status: "On track",
      created_at: "2026-09-06T00:00:00Z",
      updated_at: "2026-09-06T00:00:00Z"
    },
    batches: [{
      id: "BATCH-DB-1",
      batch_key: "BATCH-1",
      display_name: "Batch 1",
      teaching_weekday: 1,
      teaching_start: "18:00",
      teaching_end: "20:00",
      revision_weekday: 4,
      revision_start: "18:00",
      revision_end: "19:00",
      topic_test_weekday: 5,
      topic_test_start: "19:00",
      topic_test_end: "20:00"
    }],
    breaks: [{
      id: "BREAK-DB-1",
      break_key: "christmas",
      display_name: "Christmas",
      start_date: "2026-12-21",
      end_date: "2027-01-03",
      acceleration_allowed: 1
    }],
    eventOverrides: [{
      id: "OVERRIDE-DB-1",
      batch_key: "BATCH-1",
      lesson_id: "Y12-01",
      event_type: "teaching",
      override_date: "2026-09-16",
      override_start: "18:00",
      override_end: "20:00",
      reason: "private staff note"
    }],
    accelerationCycles: []
  };
}

test("write guard denies by default and accepts only the exact local QA value", async () => {
  assert.equal(await schedulerWritesAllowed(undefined), false);
  assert.equal(await schedulerWritesAllowed("local-founder-qa "), false);
  assert.equal(await schedulerWritesAllowed("local-founder-qa"), true);
});

test("local bypass works only on localhost with the exact QA value", async () => {
  const middleware = createSchedulerStaffMiddleware();
  const allowed = staffContext("http://localhost/api/staff/a-level-scheduler/2026-27/state", "GET", {
    SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa"
  });
  assert.equal((await middleware(allowed)).status, 200);
  assert.equal(allowed.data.schedulerActorIdentifier, "local-founder-qa");

  const wrongValue = staffContext("http://127.0.0.1/api/staff/a-level-scheduler/2026-27/state", "GET", {
    SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa "
  });
  assert.equal((await middleware(wrongValue)).status, 403);
});

test("local bypass fails closed on jothi.uk even if accidentally configured", async () => {
  const context = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/state", "GET", {
    SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa"
  });
  assert.equal((await createSchedulerStaffMiddleware()(context)).status, 403);
  assert.equal(context.data.schedulerActorIdentifier, undefined);
});

test("local bypass fails closed on pages.dev even if accidentally configured", async () => {
  const context = staffContext("https://jothi2026.pages.dev/api/staff/a-level-scheduler/2026-27/state", "GET", {
    SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa"
  });
  assert.equal((await createSchedulerStaffMiddleware()(context)).status, 403);
  assert.equal(context.data.schedulerActorIdentifier, undefined);
});

test("deployed staff GET and write requests without a valid Access JWT fail closed", async () => {
  const env = { CF_ACCESS_TEAM_DOMAIN: accessDomain, CF_ACCESS_AUD: accessAudience };
  const middleware = createSchedulerStaffMiddleware();
  const getContext = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/state", "GET", env);
  const writeContext = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch", "PATCH", env, undefined, {});
  assert.equal((await middleware(getContext)).status, 403);
  assert.equal((await middleware(writeContext)).status, 403);
});

test("a cryptographically validated Access email becomes the audit actor and client identity cannot override it", async () => {
  const fixture = await signedAccessFixture();
  let statements;
  const db = {
    prepare(sql) {
      return { bind: (...args) => ({ sql, args }) };
    },
    async batch(items) {
      statements = items;
      return items.map(() => ({ success: true }));
    }
  };
  const current = {
    id: "BATCH-DB-1", programme_instance_id: "PROGRAMME-1", batch_key: "BATCH-1", display_name: "Batch 1",
    teaching_weekday: 1, teaching_start: "18:00", teaching_end: "20:00",
    revision_weekday: 4, revision_start: "18:00", revision_end: "19:00",
    topic_test_weekday: 5, topic_test_start: "19:00", topic_test_end: "20:00",
    created_at: "2026-09-06T00:00:00.000Z"
  };
  const input = {
    batch_key: "BATCH-1",
    teaching: { weekday: 1, start_time: "18:00", end_time: "20:00" },
    revision: { weekday: 4, start_time: "18:00", end_time: "19:00" },
    topic_test: { weekday: 5, start_time: "19:00", end_time: "20:00" }
  };
  const context = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch?actor_identifier=attacker@example.com",
    "PATCH",
    { CF_ACCESS_TEAM_DOMAIN: accessDomain, CF_ACCESS_AUD: accessAudience },
    async () => {
      const actor = requireSchedulerWriteAccess(context);
      await upsertBatchConfiguration(db, current, input, actor, "2026-09-06T12:00:00.000Z");
      return Response.json({ actor });
    },
    { ...input, actor_identifier: "attacker@example.com" }
  );
  context.request.headers.set("Cf-Access-Jwt-Assertion", fixture.jwt);

  const response = await withAccessSigningKey(fixture.publicKey, () => createSchedulerStaffMiddleware()(context));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).actor, "verified.staff@example.com");
  assert.equal(statements[1].args[0], "verified.staff@example.com");
  assert.notEqual(statements[1].args[0], "attacker@example.com");
});

test("a valid Access service token without a human email cannot write", async () => {
  const fixture = await signedAccessFixture({ email: undefined, sub: "" });
  const context = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch",
    "PATCH",
    { CF_ACCESS_TEAM_DOMAIN: accessDomain, CF_ACCESS_AUD: accessAudience },
    async () => new Response("must not run"),
    {}
  );
  context.request.headers.set("Cf-Access-Jwt-Assertion", fixture.jwt);
  const response = await withAccessSigningKey(fixture.publicKey, () => createSchedulerStaffMiddleware()(context));
  assert.equal(response.status, 403);
});

test("public state excludes database IDs, override reasons, actors, and audit history", () => {
  const publicState = toScheduleApiState(databaseState());
  const serialized = JSON.stringify(publicState);

  assert.equal(publicState.batches[0].event_overrides[0].lesson_id, "Y12-01");
  assert.doesNotMatch(serialized, /PROGRAMME-1|BATCH-DB-1|OVERRIDE-DB-1/);
  assert.doesNotMatch(serialized, /private staff note|actor|audit/i);
});

test("public GET remains outside staff authentication and returns its read-only DTO", async () => {
  const state = databaseState();
  const db = {
    prepare(sql) {
      return {
        sql,
        bind() {
          return {
            sql,
            first: async () => state.programme
          };
        }
      };
    },
    async batch() {
      return [
        { results: state.batches },
        { results: state.breaks },
        { results: state.eventOverrides },
        { results: state.accelerationCycles }
      ];
    }
  };
  const response = await getPublicScheduleState({
    request: new Request("https://jothi.uk/api/a-level-scheduler/2026-27/state"),
    params: { academicYear: "2026-27" },
    env: { DB: db }
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).programme.academic_year, "2026-27");
});

test("schema, seed, and public state contain no Classkick, Zoom, or resource URLs", async () => {
  const schema = await readFile(new URL("../migrations/a-level-scheduler/0001_initial_schema.sql", import.meta.url), "utf8");
  const seed = await readFile(new URL("../scripts/a-level-scheduler/seed-2026-27.sql", import.meta.url), "utf8");
  const serialized = `${schema}\n${seed}\n${JSON.stringify(toScheduleApiState(databaseState()))}`;
  assert.doesNotMatch(serialized, /classkick|zoom|resource[_ -]?url|https?:\/\//i);
});

test("API state maps onto the Git baseline without duplicating curriculum records", () => {
  const apiState = toScheduleApiState(databaseState());
  const mapped = programmeFromApiState(apiState, baseline);
  const overrides = eventOverridesFromApiState(apiState);

  assert.equal(mapped.batches[0].teaching.weekday, "Monday");
  assert.equal(overrides[0].lesson_id, curriculum.sessions[0].lesson_id);
  assert.equal("lessons" in apiState, false);
  assert.equal("title" in apiState.batches[0].event_overrides[0], false);
});

test("server validation rejects unknown years, fields, lessons, event types, dates, and time ranges", () => {
  assert.throws(() => assertAcademicYear("2027-28"), (error) => error.status === 404);
  assert.throws(() => validateEventOverridePayload({
    batch_key: "BATCH-1",
    lesson_id: "Y12-29",
    event_type: "teaching",
    override_date: "2026-09-16",
    override_start: "18:00",
    override_end: "20:00"
  }), (error) => error.status === 404);
  assert.throws(() => validateEventOverridePayload({
    batch_key: "BATCH-1",
    lesson_id: "Y12-01",
    event_type: "lesson",
    override_date: "2026-02-30",
    override_start: "20:00",
    override_end: "18:00",
    unexpected: true
  }), (error) => error.status === 400);
});

test("acceleration validation requires ordered events inside the selected break", () => {
  const cycle = {
    batch_key: "BATCH-1",
    lesson_id: "Y12-15",
    break_key: "christmas",
    teaching: { date: "2026-12-22", start_time: "10:00", end_time: "12:00" },
    revision: { date: "2026-12-23", start_time: "10:00", end_time: "11:00" },
    topic_test: { date: "2026-12-24", start_time: "10:00", end_time: "11:00" },
    enabled: true
  };
  validateAccelerationPayload(cycle);
  assertAccelerationInsideBreak(cycle, { start_date: "2026-12-21", end_date: "2027-01-03" });
  assert.throws(() => assertAccelerationInsideBreak(
    { ...cycle, teaching: { ...cycle.teaching, date: "2026-12-20" } },
    { start_date: "2026-12-21", end_date: "2027-01-03" }
  ), (error) => error.status === 400);
});

test("local config contains placeholders only and never enables writes", async () => {
  const config = await readFile(new URL("../wrangler.scheduler.local.jsonc", import.meta.url), "utf8");
  const example = await readFile(new URL("../.dev.vars.example", import.meta.url), "utf8");
  const gitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");

  assert.match(config, /LOCAL DEVELOPMENT ONLY/);
  assert.match(config, /00000000-0000-4000-8000-00000000000[01]/);
  assert.doesNotMatch(config, /SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES/);
  assert.match(example, /^#.*\nSCHEDULER_ALLOW_UNAUTHENTICATED_WRITES=local-founder-qa\s*$/);
  assert.match(gitignore, /^\.dev\.vars$/m);
  assert.match(gitignore, /^\.wrangler\/$/m);
});
