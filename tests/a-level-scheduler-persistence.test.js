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
import { toScheduleApiState, updateAssessmentEventDateTime, upsertBatchConfiguration } from "../functions/_lib/scheduler-db.js";
import { onRequest as protectScheduleApi } from "../functions/api/a-level-scheduler/_middleware.js";
import { onRequest as protectStaffApi } from "../functions/api/staff/a-level-scheduler/_middleware.js";
import { onRequestGet as getPublicScheduleState } from "../functions/api/a-level-scheduler/[academicYear]/state.js";
import { onRequestGet as getALevelIdentity } from "../functions/api/a-level/me.js";
import { onRequestPatch as patchProgramme } from "../functions/api/staff/a-level-scheduler/[academicYear]/programme.js";
import { onRequestPatch as patchBatch } from "../functions/api/staff/a-level-scheduler/[academicYear]/batch.js";
import {
  onRequestDelete as deleteEventOverride,
  onRequestPut as putEventOverride
} from "../functions/api/staff/a-level-scheduler/[academicYear]/event-override.js";
import { onRequestPatch as patchAssessmentEvent } from "../functions/api/staff/a-level-scheduler/[academicYear]/assessment-event.js";
import {
  onRequestDelete as deleteAcceleration,
  onRequestPut as putAcceleration
} from "../functions/api/staff/a-level-scheduler/[academicYear]/acceleration.js";
import {
  assertAccelerationInsideBreak,
  assertAcademicYear,
  validateAssessmentEventPatch,
  validateAccelerationPayload,
  validateEventOverridePayload
} from "../functions/_lib/scheduler-validation.js";
import {
  eventOverridesFromApiState,
  programmeFromApiState
} from "../a-level-scheduler-public-state.js";

const baseline = JSON.parse(await readFile(new URL("../data/a-level-maths/2026-27.json", import.meta.url), "utf8"));
const curriculum = JSON.parse(await readFile(new URL("../data/a-level-maths/year12-curriculum.json", import.meta.url), "utf8"));
const accessDomain = "https://jothi-test.cloudflareaccess.com";
const accessAudience = "scheduler-test-audience";
const accessEnv = { ACCESS_DOMAIN: accessDomain, ACCESS_AUD: accessAudience };
const syntheticUsers = Object.freeze({
  "admin.user@example.test": Object.freeze({ code: "ADMIN-TEST", label: "Test Admin", role: "admin" }),
  "editor.user@example.test": Object.freeze({ code: "EDITOR-TEST", label: "Test Editor", role: "editor" }),
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
      target_completion_date: "2027-05-31",
      status: "On track",
      created_at: "2026-09-06T00:00:00Z",
      updated_at: "2026-09-06T00:00:00Z"
    },
    batches: [
      {
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
      },
      {
        id: "BATCH-DB-2",
        batch_key: "BATCH-2",
        display_name: "Batch 2",
        teaching_weekday: 2,
        teaching_start: "18:00",
        teaching_end: "20:00",
        revision_weekday: 4,
        revision_start: "19:00",
        revision_end: "20:00",
        topic_test_weekday: 5,
        topic_test_start: "19:00",
        topic_test_end: "20:00"
      }
    ],
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
    accelerationCycles: [],
    assessmentEvents: [
      {
        id: "ASSESSMENT-DB-1",
        batch_id: "BATCH-DB-1",
        batch_key: "BATCH-1",
        assessment_key: "october-monthly-test",
        assessment_type: "monthly_test",
        label: "October monthly Topic Test",
        assessment_date: "2026-10-30",
        start_time: "19:00",
        end_time: "20:00",
        mock_cycle: null,
        paper: null,
        coverage_note: null,
        created_at: "2026-09-06T00:00:00Z",
        updated_at: "2026-09-06T00:00:00Z"
      },
      {
        id: "ASSESSMENT-DB-2",
        batch_id: "BATCH-DB-2",
        batch_key: "BATCH-2",
        assessment_key: "october-monthly-test",
        assessment_type: "monthly_test",
        label: "October monthly Topic Test",
        assessment_date: "2026-10-30",
        start_time: "19:00",
        end_time: "20:00",
        mock_cycle: null,
        paper: null,
        coverage_note: null,
        created_at: "2026-09-06T00:00:00Z",
        updated_at: "2026-09-06T00:00:00Z"
      }
    ]
  };
}

function scheduleDatabase(state = databaseState()) {
  return {
    prepare(sql) {
      return {
        sql,
        bind() {
          return {
            sql,
            first: async () => state.programme,
            all: async () => ({ results: state.assessmentEvents })
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
}

function assessmentUpdateDatabase(state = databaseState()) {
  state.mutationBatches = [];
  return {
    prepare(sql) {
      return {
        sql,
        bind(...args) {
          return {
            sql,
            args,
            first: async () => {
              if (sql.includes("FROM programme_instances")) {
                return state.programme;
              }
              if (sql.includes("FROM batches WHERE")) {
                return state.batches.find((batch) => (
                  batch.programme_instance_id === args[0] || args[0] === state.programme.id
                ) && batch.batch_key === args[1]) || null;
              }
              if (sql.includes("FROM assessment_events WHERE")) {
                return state.assessmentEvents.find((event) => (
                  event.batch_id === args[0] && event.assessment_key === args[1]
                )) || null;
              }
              return null;
            },
            all: async () => {
              if (sql.includes("FROM assessment_events")) {
                return { results: state.assessmentEvents };
              }
              return { results: [] };
            }
          };
        }
      };
    },
    async batch(items) {
      if (items.length === 4 && items.every((item) => item.sql.includes("SELECT"))) {
        return [
          { results: state.batches },
          { results: state.breaks },
          { results: state.eventOverrides },
          { results: state.accelerationCycles }
        ];
      }
      state.mutationBatches.push(items);
      const update = items.find((item) => item.sql.includes("UPDATE assessment_events"));
      if (update) {
        const [assessmentDate, startTime, endTime, updatedAt, id] = update.args;
        const event = state.assessmentEvents.find((item) => item.id === id);
        Object.assign(event, {
          assessment_date: assessmentDate,
          start_time: startTime,
          end_time: endTime,
          updated_at: updatedAt
        });
      }
      return items.map(() => ({ success: true }));
    }
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

test("mapped admins, editors, and viewers authenticate with normalised verified Access email", async () => {
  for (const [email, expected] of [
    [" Admin.User@Example.Test ", { code: "ADMIN-TEST", role: "admin" }],
    ["EDITOR.USER@EXAMPLE.TEST", { code: "EDITOR-TEST", role: "editor" }],
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

test("viewer event writes receive 403 while editor and admin event writes are allowed", async () => {
  let viewerNextCalled = false;
  const viewer = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/event-override", "PUT", accessEnv, async () => {
    viewerNextCalled = true;
    try {
      requireSchedulerWriteAccess(viewer, "event_override");
      return new Response("must not run");
    } catch (error) {
      return new Response(null, { status: error.status });
    }
  }, {});
  assert.equal((await runAuthenticated(viewer, { email: "viewer.user@example.test" })).status, 403);
  assert.equal(viewerNextCalled, true);

  const editor = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/event-override", "PUT", accessEnv, async () => {
    return Response.json({ actor: requireSchedulerWriteAccess(editor, "event_override") });
  }, {});
  const editorResponse = await runAuthenticated(editor, { email: "editor.user@example.test" });
  assert.equal(editorResponse.status, 200);
  assert.equal((await editorResponse.json()).actor, "EDITOR-TEST");

  const admin = staffContext("https://jothi.uk/api/staff/a-level-scheduler/2026-27/batch", "PATCH", accessEnv, async () => {
    return Response.json({ actor: requireSchedulerWriteAccess(admin, "event_override") });
  }, {});
  const adminResponse = await runAuthenticated(admin);
  assert.equal(adminResponse.status, 200);
  assert.equal((await adminResponse.json()).actor, "ADMIN-TEST");
});

test("editors cannot change programme, recurring batch, or acceleration configuration while admins can", () => {
  const editorContext = { data: { aLevelPrincipal: { code: "EDITOR-TEST", role: "editor" } } };
  const adminContext = { data: { aLevelPrincipal: { code: "ADMIN-TEST", role: "admin" } } };
  for (const permission of ["programme_configuration", "batch_configuration", "acceleration"]) {
    assert.throws(
      () => requireSchedulerWriteAccess(editorContext, permission),
      (error) => error.status === 403
    );
    assert.equal(requireSchedulerWriteAccess(adminContext, permission), "ADMIN-TEST");
  }
});

test("every scheduler write endpoint declares its server-side permission", async () => {
  const programme = await readFile(new URL("../functions/api/staff/a-level-scheduler/[academicYear]/programme.js", import.meta.url), "utf8");
  const batch = await readFile(new URL("../functions/api/staff/a-level-scheduler/[academicYear]/batch.js", import.meta.url), "utf8");
  const override = await readFile(new URL("../functions/api/staff/a-level-scheduler/[academicYear]/event-override.js", import.meta.url), "utf8");
  const assessment = await readFile(new URL("../functions/api/staff/a-level-scheduler/[academicYear]/assessment-event.js", import.meta.url), "utf8");
  const acceleration = await readFile(new URL("../functions/api/staff/a-level-scheduler/[academicYear]/acceleration.js", import.meta.url), "utf8");
  assert.match(programme, /requireSchedulerWriteAccess\(context, "programme_configuration"\)/);
  assert.match(batch, /requireSchedulerWriteAccess\(context, "batch_configuration"\)/);
  assert.equal((override.match(/requireSchedulerWriteAccess\(context, "event_override"\)/g) || []).length, 2);
  assert.equal((assessment.match(/requireSchedulerWriteAccess\(context, "event_override"\)/g) || []).length, 1);
  assert.doesNotMatch(assessment, /onRequest(?:Put|Post|Delete)|INSERT INTO assessment_events|DELETE FROM assessment_events/);
  assert.equal((acceleration.match(/requireSchedulerWriteAccess\(context, "acceleration"\)/g) || []).length, 2);

  const viewerData = { aLevelPrincipal: { code: "VIEWER-TEST", role: "viewer" } };
  for (const [method, handler] of [
    ["PATCH", patchProgramme],
    ["PATCH", patchBatch],
    ["PUT", putEventOverride],
    ["DELETE", deleteEventOverride],
    ["PATCH", patchAssessmentEvent],
    ["PUT", putAcceleration],
    ["DELETE", deleteAcceleration]
  ]) {
    const response = await handler({
      request: new Request("https://jothi.uk/api/staff/a-level-scheduler/unknown", { method }),
      params: { academicYear: "unknown" },
      env: {},
      data: viewerData
    });
    assert.equal(response.status, 403);
  }
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
      const actor = requireSchedulerWriteAccess(context, "batch_configuration");
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

test("public state exposes assessment schedule fields without database IDs or audit fields", () => {
  const state = databaseState();
  state.assessmentEvents = [{
    id: "ASSESSMENT-DB-1",
    batch_key: "BATCH-1",
    assessment_key: "midway-mock-paper-2",
    assessment_type: "mock_paper",
    label: "Midway Mock — Paper 2 Statistics and Mechanics",
    assessment_date: "2027-01-16",
    start_time: "10:00",
    end_time: "11:15",
    mock_cycle: "midway",
    paper: "paper_2_statistics_mechanics",
    coverage_note: null
  }];

  const publicState = toScheduleApiState(state);
  assert.deepEqual(publicState.batches[0].assessment_events, [{
    assessment_key: "midway-mock-paper-2",
    assessment_type: "mock_paper",
    label: "Midway Mock — Paper 2 Statistics and Mechanics",
    date: "2027-01-16",
    start_time: "10:00",
    end_time: "11:15",
    mock_cycle: "midway",
    paper: "paper_2_statistics_mechanics"
  }]);
  assert.doesNotMatch(JSON.stringify(publicState), /ASSESSMENT-DB-1|created_at|updated_at|audit|actor/i);
});

test("assessment update validation allows only date and time fields", () => {
  validateAssessmentEventPatch({
    batch_key: "BATCH-1",
    assessment_key: "october-monthly-test",
    assessment_date: "2026-10-31",
    start_time: "18:30",
    end_time: "19:30"
  });
  assert.throws(() => validateAssessmentEventPatch({
    batch_key: "BATCH-1",
    assessment_key: "october-monthly-test",
    assessment_date: "2026-10-31",
    start_time: "19:30",
    end_time: "18:30"
  }), (error) => error.status === 400);
  assert.throws(() => validateAssessmentEventPatch({
    batch_key: "BATCH-1",
    assessment_key: "october-monthly-test",
    assessment_type: "mock_paper",
    assessment_date: "2026-10-31",
    start_time: "18:30",
    end_time: "19:30"
  }), (error) => error.status === 400);
});

test("assessment event updates change only the selected batch row and record audit", async () => {
  const state = databaseState();
  const db = assessmentUpdateDatabase(state);
  const context = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/assessment-event",
    "PATCH",
    { DB: db },
    async () => patchAssessmentEvent(context),
    {
      batch_key: "BATCH-1",
      assessment_key: "october-monthly-test",
      assessment_date: "2026-10-31",
      start_time: "18:30",
      end_time: "19:30"
    }
  );
  context.params = { academicYear: "2026-27" };
  context.data = { aLevelPrincipal: { code: "EDITOR-TEST", role: "editor" } };

  const response = await patchAssessmentEvent(context);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.batches[0].assessment_events[0], {
    assessment_key: "october-monthly-test",
    assessment_type: "monthly_test",
    label: "October monthly Topic Test",
    date: "2026-10-31",
    start_time: "18:30",
    end_time: "19:30"
  });
  assert.deepEqual(body.batches[1].assessment_events[0], {
    assessment_key: "october-monthly-test",
    assessment_type: "monthly_test",
    label: "October monthly Topic Test",
    date: "2026-10-30",
    start_time: "19:00",
    end_time: "20:00"
  });

  const audit = state.mutationBatches[0][1];
  assert.equal(audit.args[0], "EDITOR-TEST");
  assert.equal(audit.args[1], "assessment_event.updated");
  assert.equal(audit.args[2], "assessment_event");
  assert.equal(JSON.parse(audit.args[4]).assessment_date, "2026-10-30");
  assert.equal(JSON.parse(audit.args[5]).assessment_date, "2026-10-31");
});

test("assessment event endpoint rejects missing rows, anonymous writes, identity changes, and delete attempts", async () => {
  const baseBody = {
    batch_key: "BATCH-1",
    assessment_key: "missing-assessment",
    assessment_date: "2026-10-31",
    start_time: "18:30",
    end_time: "19:30"
  };
  let context = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/assessment-event",
    "PATCH",
    { DB: assessmentUpdateDatabase(databaseState()) },
    async () => patchAssessmentEvent(context),
    baseBody
  );
  context.params = { academicYear: "2026-27" };
  context.data = { aLevelPrincipal: { code: "EDITOR-TEST", role: "editor" } };
  assert.equal((await patchAssessmentEvent(context)).status, 404);

  context = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/assessment-event",
    "PATCH",
    { DB: assessmentUpdateDatabase(databaseState()) },
    async () => patchAssessmentEvent(context),
    { ...baseBody, assessment_key: "october-monthly-test" }
  );
  context.params = { academicYear: "2026-27" };
  assert.equal((await patchAssessmentEvent(context)).status, 403);

  context = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/assessment-event",
    "PATCH",
    { DB: assessmentUpdateDatabase(databaseState()) },
    async () => patchAssessmentEvent(context),
    { ...baseBody, assessment_key: "october-monthly-test", label: "Changed identity" }
  );
  context.params = { academicYear: "2026-27" };
  context.data = { aLevelPrincipal: { code: "EDITOR-TEST", role: "editor" } };
  assert.equal((await patchAssessmentEvent(context)).status, 400);
});

test("mapped viewers, editors, and admins can read authenticated schedule data", async () => {
  for (const email of [
    "viewer.user@example.test",
    "editor.user@example.test",
    "admin.user@example.test"
  ]) {
    const context = staffContext(
      "https://jothi.uk/api/a-level-scheduler/2026-27/state",
      "GET",
      { ...accessEnv, DB: scheduleDatabase() },
      async () => getPublicScheduleState(context)
    );
    context.params = { academicYear: "2026-27" };
    const response = await runAuthenticated(context, { email });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).programme.academic_year, "2026-27");
  }
});

test("Sruthi authenticates as a viewer, can read the schedule, and cannot perform scheduler writes", async () => {
  const readContext = staffContext(
    "https://jothi.uk/api/a-level-scheduler/2026-27/state",
    "GET",
    { ...accessEnv, DB: scheduleDatabase() },
    async () => getPublicScheduleState(readContext)
  );
  readContext.params = { academicYear: "2026-27" };
  const readResponse = await runAuthenticated(readContext, { email: "sruthi@jothi.uk" }, A_LEVEL_USERS);
  assert.equal(readResponse.status, 200);
  assert.equal((await readResponse.json()).programme.academic_year, "2026-27");

  for (const [method, handler, path] of [
    ["PATCH", patchProgramme, "programme"],
    ["PATCH", patchBatch, "batch"],
    ["PUT", putEventOverride, "event-override"],
    ["DELETE", deleteEventOverride, "event-override"],
    ["PATCH", patchAssessmentEvent, "assessment-event"],
    ["PUT", putAcceleration, "acceleration"],
    ["DELETE", deleteAcceleration, "acceleration"]
  ]) {
    let context;
    context = staffContext(
      `https://jothi.uk/api/staff/a-level-scheduler/2026-27/${path}`,
      method,
      accessEnv,
      async () => handler(context),
      {}
    );
    context.params = { academicYear: "2026-27" };
    assert.equal(
      (await runAuthenticated(context, { email: "sruthi@jothi.uk" }, A_LEVEL_USERS)).status,
      403,
      `${method} ${path} must remain unavailable to Sruthi`
    );
  }
});

test("anonymous public schedule GET returns only the approved public DTO", async () => {
  let publicContext;
  publicContext = staffContext(
    "https://jothi.uk/api/a-level-scheduler/2026-27/state",
    "GET",
    { DB: scheduleDatabase() },
    async () => getPublicScheduleState(publicContext)
  );
  publicContext.params = { academicYear: "2026-27" };
  const response = await protectScheduleApi(publicContext);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, toScheduleApiState(databaseState()));
  assert.doesNotMatch(JSON.stringify(body), /audit|actor|reason|note|classkick|zoom|resource|email|role|token|secret/i);
});

test("anonymous public page renders while anonymous staff GET and writes remain blocked", async () => {
  const publicTemplate = await readFile(new URL("../a-level-year12-schedule.html", import.meta.url), "utf8");
  assert.match(publicTemplate, /src="a-level-schedule-public\.js"/);
  assert.doesNotMatch(publicTemplate, /a-level-scheduler\.js/);

  const anonymousStaffGet = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/state",
    "GET",
    accessEnv,
    async () => new Response("staff route must not be reached")
  );
  assert.equal((await protectStaffApi(anonymousStaffGet)).status, 403);

  const anonymousStaffWrite = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/event-override",
    "PUT",
    accessEnv,
    async () => new Response("staff route must not be reached"),
    {}
  );
  assert.equal((await protectStaffApi(anonymousStaffWrite)).status, 403);

  const unmapped = staffContext(
    "https://jothi.uk/api/staff/a-level-scheduler/2026-27/state",
    "GET",
    { ...accessEnv, DB: scheduleDatabase() },
    async () => new Response("staff route must not be reached")
  );
  assert.equal((await runAuthenticated(unmapped, { email: "unmapped.user@example.test" })).status, 403);
});

test("schema, seed, and public state contain no Classkick, Zoom, or resource URLs", async () => {
  const schema = await readFile(new URL("../migrations/a-level-scheduler/0001_initial_schema.sql", import.meta.url), "utf8");
  const assessmentSchema = await readFile(new URL("../migrations/a-level-scheduler/0002_assessment_events.sql", import.meta.url), "utf8");
  const seed = await readFile(new URL("../scripts/a-level-scheduler/seed-2026-27.sql", import.meta.url), "utf8");
  const serialized = `${schema}\n${assessmentSchema}\n${seed}\n${JSON.stringify(toScheduleApiState(databaseState()))}`;
  assert.doesNotMatch(serialized, /classkick|zoom|resource[_ -]?url|https?:\/\//i);
});

test("seed inserts the approved assessment calendar for both batches without resetting conflicts", async () => {
  const seed = await readFile(new URL("../scripts/a-level-scheduler/seed-2026-27.sql", import.meta.url), "utf8");

  assert.match(seed, /target_completion_date = excluded\.target_completion_date/);
  assert.match(seed, /ON CONFLICT\(batch_id, assessment_key\) DO NOTHING/);
  assert.doesNotMatch(seed, /ON CONFLICT\(batch_id, assessment_key\) DO UPDATE SET/);
  assert.equal((seed.match(/'october-monthly-test', 'monthly_test'/g) || []).length, 2);
  assert.equal((seed.match(/'final-mock-paper-2', 'mock_paper'/g) || []).length, 2);
  for (const date of [
    "2026-10-30",
    "2026-11-27",
    "2026-12-18",
    "2027-01-15",
    "2027-01-22",
    "2027-02-26",
    "2027-03-19",
    "2027-04-30",
    "2027-05-14",
    "2027-05-21"
  ]) {
    assert.equal((seed.match(new RegExp(date, "g")) || []).length, 2);
  }
});

test("seed rerun preserves staff-adjusted assessment date and time without duplicates", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const schema = await readFile(new URL("../migrations/a-level-scheduler/0001_initial_schema.sql", import.meta.url), "utf8");
  const assessmentSchema = await readFile(new URL("../migrations/a-level-scheduler/0002_assessment_events.sql", import.meta.url), "utf8");
  const seed = await readFile(new URL("../scripts/a-level-scheduler/seed-2026-27.sql", import.meta.url), "utf8");
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(schema);
    db.exec(assessmentSchema);
    db.exec(seed);

    const defaultRow = db.prepare(`
      SELECT assessment_date, start_time, end_time
      FROM assessment_events
      WHERE batch_id = ? AND assessment_key = ?
    `).get("ALEVEL-MATHS-Y12:2026-27:BATCH-1", "october-monthly-test");
    assert.equal(defaultRow.assessment_date, "2026-10-30");
    assert.equal(defaultRow.start_time, "19:00");
    assert.equal(defaultRow.end_time, "20:00");

    db.prepare(`
      UPDATE assessment_events
      SET assessment_date = ?, start_time = ?, end_time = ?
      WHERE batch_id = ? AND assessment_key = ?
    `).run(
      "2026-10-31",
      "18:30",
      "19:30",
      "ALEVEL-MATHS-Y12:2026-27:BATCH-1",
      "october-monthly-test"
    );

    db.exec(seed);

    const rerunRow = db.prepare(`
      SELECT assessment_date, start_time, end_time
      FROM assessment_events
      WHERE batch_id = ? AND assessment_key = ?
    `).get("ALEVEL-MATHS-Y12:2026-27:BATCH-1", "october-monthly-test");
    const rowCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM assessment_events
      WHERE batch_id = ? AND assessment_key = ?
    `).get("ALEVEL-MATHS-Y12:2026-27:BATCH-1", "october-monthly-test");

    assert.equal(rerunRow.assessment_date, "2026-10-31");
    assert.equal(rerunRow.start_time, "18:30");
    assert.equal(rerunRow.end_time, "19:30");
    assert.equal(rowCount.count, 1);
  } finally {
    db.close();
  }
});

test("staff UI loads mapped identity and displays its label without rendering an email", async () => {
  const controller = await readFile(new URL("../a-level-scheduler.js", import.meta.url), "utf8");
  const template = await readFile(new URL("../a-level-year12-scheduler.html", import.meta.url), "utf8");
  assert.match(controller, /fetch\("\/api\/a-level\/me"/);
  assert.match(controller, /Signed in as \$\{identity\.user\.label\}/);
  assert.match(controller, /\["editor", "admin"\]\.includes\(identity\.user\.role\)/);
  assert.match(controller, /canConfigureSchedule = identity\.user\.role === "admin"/);
  assert.doesNotMatch(controller, /identity\.user\.email/);
  assert.match(template, /id="scheduler-identity"/);
});

test("approved production allow-list is exact and excludes unapproved users", async () => {
  const accessSource = await readFile(new URL("../functions/_lib/scheduler-access.js", import.meta.url), "utf8");
  const usersSource = await readFile(new URL("../functions/_lib/a-level-users.js", import.meta.url), "utf8");
  const design = await readFile(new URL("../docs/A_LEVEL_SCHEDULER_PERSISTENCE_DESIGN.md", import.meta.url), "utf8");
  const combined = `${accessSource}\n${usersSource}\n${design}`;
  assert.deepEqual(A_LEVEL_USERS, {
    "prakash@jothi.uk": { code: "prakash", label: "Prakash", role: "admin" },
    "ashwin@jothi.uk": { code: "ashwin", label: "Ashwin", role: "editor" },
    "kiran@jothi.uk": { code: "kiran", label: "Kiran", role: "editor" },
    "miriyam@jothi.uk": { code: "miriyam", label: "Miriyam", role: "editor" },
    "radhika@jothi.uk": { code: "radhika", label: "Radhika", role: "viewer" },
    "sruthi@jothi.uk": { code: "sruthi", label: "Sruthi", role: "viewer" }
  });
  assert.deepEqual(principalFromAccess({
    cloudflareAccess: { JWT: { payload: { email: " PRAKASH@JOTHI.UK " } } }
  }), { email: "prakash@jothi.uk", code: "prakash", label: "Prakash", role: "admin" });
  assert.equal(principalFromAccess({
    cloudflareAccess: { JWT: { payload: { email: "saranya@jothi.uk" } } }
  }), null);
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
  assert.match(example, /^#.*\r?\nSCHEDULER_ALLOW_UNAUTHENTICATED_WRITES=local-founder-qa\s*$/);
  assert.match(gitignore, /^\.dev\.vars$/m);
  assert.match(gitignore, /^\.wrangler\/$/m);
});
