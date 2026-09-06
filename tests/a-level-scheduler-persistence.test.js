import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createALevelAccessMiddleware
} from "../functions/_lib/scheduler-access.js";
import { A_LEVEL_USERS, principalFromAccess } from "../functions/_lib/a-level-users.js";
import {
  requireSchedulerWriteAccess,
  schedulerWritesAllowed
} from "../functions/_lib/scheduler-write-guard.js";
import { toScheduleApiState, upsertBatchConfiguration } from "../functions/_lib/scheduler-db.js";
import { onRequestGet as getPublicScheduleState } from "../functions/api/a-level-scheduler/[academicYear]/state.js";
import { onRequestGet as getALevelIdentity } from "../functions/api/a-level/me.js";
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
const accessEnv = { ACCESS_DOMAIN: accessDomain, ACCESS_AUD: accessAudience };
const syntheticUsers = Object.freeze({
  "admin.user@example.test": Object.freeze({ code: "ADMIN-TEST", label: "Test Admin", role: "admin" }),
  "viewer.user@example.test": Object.freeze({ code: "VIEWER-TEST", label: "Test Viewer", role: "viewer" })
});

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
    email: " Admin.User@Example.Test ",
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

async function runAuthenticated(context, payloadOverrides = {}, users = syntheticUsers) {
  const fixture = await signedAccessFixture(payloadOverrides);
  context.request.headers.set("Cf-Access-Jwt-Assertion", fixture.jwt);
  return withAccessSigningKey(
    fixture.publicKey,
    () => createALevelAccessMiddleware({ users })(context)
  );
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

test("local bypass supplies a synthetic admin principal only on localhost with the exact value", async () => {
  const middleware = createALevelAccessMiddleware();
  const allowed = staffContext("http://localhost/api/staff/a-level-scheduler/2026-27/state", "GET", {
    SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa"
  });
  assert.equal((await middleware(allowed)).status, 200);
  assert.deepEqual(allowed.data.aLevelPrincipal, {
    email: "local-founder-qa@localhost.invalid",
    code: "local-founder-qa",
    label: "Local founder QA",
    role: "admin"
  });

  const wrongValue = staffContext("http://127.0.0.1/api/staff/a-level-scheduler/2026-27/state", "GET", {
    SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa "
  });
  assert.equal((await middleware(wrongValue)).status, 503);
});

test("local bypass cannot operate on jothi.uk or pages.dev", async () => {
  for (const hostname of ["jothi.uk", "jothi2026.pages.dev"]) {
    const context = staffContext(`https://${hostname}/api/staff/a-level-scheduler/2026-27/state`, "GET", {
      SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES: "local-founder-qa"
    });
    assert.equal((await createALevelAccessMiddleware()(context)).status, 503);
    assert.equal(context.data.aLevelPrincipal, undefined);
  }
});

test("missing ACCESS_DOMAIN or ACCESS_AUD returns 503", async () => {
  const missingDomain = staffContext("https://jothi.uk/api/a-level/me", "GET", { ACCESS_AUD: accessAudience });
  const missingAudience = staffContext("https://jothi.uk/api/a-level/me", "GET", { ACCESS_DOMAIN: accessDomain });
  assert.equal((await createALevelAccessMiddleware()(missingDomain)).status, 503);
  assert.equal((await createALevelAccessMiddleware()(missingAudience)).status, 503);
});

test("mapped admins and viewers authenticate with normalised verified Access email", async () => {
  for (const [email, expected] of [
    [" Admin.User@Example.Test ", { code: "ADMIN-TEST", role: "admin" }],
    ["VIEWER.USER@EXAMPLE.TEST", { code: "VIEWER-TEST", role: "viewer" }]
  ]) {
    const context = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/state", "GET", accessEnv, async () => {
      return Response.json(context.data.aLevelPrincipal);
    });
    const response = await runAuthenticated(context, { email });
    assert.equal(response.status, 200);
    const principal = await response.json();
    assert.equal(principal.code, expected.code);
    assert.equal(principal.role, expected.role);
    assert.equal(principal.email, email.trim().toLowerCase());
  }
});

test("principalFromAccess ignores non-Access identity fields and unmapped users return null", () => {
  const data = {
    email: "admin.user@example.test",
    actor_identifier: "admin.user@example.test",
    cloudflareAccess: { JWT: { payload: { email: "unknown.user@example.test" } } }
  };
  assert.equal(principalFromAccess(data, syntheticUsers), null);
});

test("an authenticated but unmapped Cloudflare user receives 403", async () => {
  const context = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/state", "GET", accessEnv);
  assert.equal((await runAuthenticated(context, { email: "unmapped.user@example.test" })).status, 403);
});

test("viewer writes receive 403 while admin writes are allowed", async () => {
  let viewerNextCalled = false;
  const viewer = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch", "PATCH", accessEnv, async () => {
    viewerNextCalled = true;
    return new Response("must not run");
  }, {});
  assert.equal((await runAuthenticated(viewer, { email: "viewer.user@example.test" })).status, 403);
  assert.equal(viewerNextCalled, false);

  const admin = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch", "PATCH", accessEnv, async () => {
    return Response.json({ actor: requireSchedulerWriteAccess(admin) });
  }, {});
  const adminResponse = await runAuthenticated(admin);
  assert.equal(adminResponse.status, 200);
  assert.equal((await adminResponse.json()).actor, "ADMIN-TEST");
});

test("/api/a-level/me returns mapped code, label, and role without email", async () => {
  const context = staffContext("https://jothi.uk/api/a-level/me", "GET", accessEnv, async () => getALevelIdentity(context));
  const response = await runAuthenticated(context, { email: "viewer.user@example.test" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: { code: "VIEWER-TEST", label: "Test Viewer", role: "viewer" }
  });
});

test("audit uses admin principal code and browser-supplied identity cannot override it", async () => {
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
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch?actor_identifier=attacker@example.test",
    "PATCH",
    accessEnv,
    async () => {
      const actor = requireSchedulerWriteAccess(context);
      await upsertBatchConfiguration(db, current, input, actor, "2026-09-06T12:00:00.000Z");
      return Response.json({ actor });
    },
    { ...input, actor_identifier: "attacker@example.test" }
  );
  context.request.headers.set("X-Staff-Email", "attacker@example.test");
  const response = await runAuthenticated(context);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).actor, "ADMIN-TEST");
  assert.equal(statements[1].args[0], "ADMIN-TEST");
  assert.notEqual(statements[1].args[0], "attacker@example.test");
});

test("deployed request without a valid Access JWT fails closed", async () => {
  const context = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/state", "GET", accessEnv);
  assert.equal((await createALevelAccessMiddleware({ users: syntheticUsers })(context)).status, 403);
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

test("staff UI loads mapped identity and displays its label without rendering an email", async () => {
  const controller = await readFile(new URL("../a-level-scheduler.js", import.meta.url), "utf8");
  const template = await readFile(new URL("../a-level-year12-scheduler.html", import.meta.url), "utf8");
  assert.match(controller, /fetch\("\/api\/a-level\/me"/);
  assert.match(controller, /Signed in as \$\{identity\.user\.label\}/);
  assert.doesNotMatch(controller, /identity\.user\.email/);
  assert.match(template, /id="scheduler-identity"/);
});

test("production allow-list is empty and auth sources contain no credentials or legacy environment names", async () => {
  const accessSource = await readFile(new URL("../functions/_lib/scheduler-access.js", import.meta.url), "utf8");
  const usersSource = await readFile(new URL("../functions/_lib/a-level-users.js", import.meta.url), "utf8");
  const design = await readFile(new URL("../docs/A_LEVEL_SCHEDULER_PERSISTENCE_DESIGN.md", import.meta.url), "utf8");
  const combined = `${accessSource}\n${usersSource}\n${design}`;
  assert.deepEqual(Object.keys(A_LEVEL_USERS), []);
  assert.match(combined, /ACCESS_DOMAIN/);
  assert.match(combined, /ACCESS_AUD/);
  assert.equal(combined.includes(["CF", "ACCESS", "TEAM", "DOMAIN"].join("_")), false);
  assert.equal(combined.includes(["CF", "ACCESS", "AUD"].join("_")), false);
  assert.doesNotMatch(combined, /Bearer\s+[A-Za-z0-9._-]+|eyJ[A-Za-z0-9_-]+\./);
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
