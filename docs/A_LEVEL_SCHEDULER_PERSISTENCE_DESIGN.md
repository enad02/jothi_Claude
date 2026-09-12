# A-Level Scheduler Persistence Design

Status: **REAL D1 RESOURCE PROVISIONED AND PRODUCTION API READS ACTIVE; APPROVED ASSESSMENT CALENDAR PREPARED IN CODE**.

The real `jothi-a-level-scheduler` D1 database has been created in Cloudflare Western Europe. Migration `0001_initial_schema.sql` and the idempotent 2026–27 baseline seed have been applied. The database is not bound to Preview or Production, and no scheduler code has been deployed.

## Boundary rule

> Hiding a staff control with CSS or JavaScript is not access control.

The schedule-facing application is public and read-only. It has its own controller, does not initialise staff editing behaviour, and contains no staff controls in its DOM. Its public API exposes only the approved schedule DTO. Staff views and staff APIs require Cloudflare Access authentication plus the A-Level application allow-list. Sensitive operational data and protected URLs must never be sent to the browser and merely hidden.

Both views continue to share:

- the Git-owned curriculum library at `data/a-level-maths/year12-curriculum.json`;
- the MVP baseline at `data/a-level-maths/2026-27.json`;
- `a-level-scheduler-engine.js` for schedule generation; and
- `a-level-scheduler-view.js` for shared rendering helpers.

D1 stores operational scheduling state only. It does not duplicate lesson titles, lesson sequence, or curriculum duration.

## Implemented local architecture

```text
Public schedule browser
    -> GET read-only state API
    -> Cloudflare Pages Function
    -> local D1 operational state

Staff browser
    -> Cloudflare Access JWT validation
    -> authenticated GET / guarded writes
    -> Cloudflare Pages Functions
    -> D1 operational state + audit log
```

The read-only and staff controllers combine the API state with the same Git curriculum and run the same scheduling engine. The read-only controller shows a restrained unavailable message instead of silently falling back to potentially stale baseline data.

## Data ownership

### Curriculum library: Git

`data/a-level-maths/year12-curriculum.json` remains the source for stable lesson IDs, titles, sequence, and two-hour curriculum duration. Operational changes never write to this file.

### Academic-year baseline: Git

`data/a-level-maths/2026-27.json` remains the approved seed/default source. It includes the programme target completion date of `2027-05-31` and the approved fixed set of ten formal assessment identities per batch. The local seed creates the corresponding operational programme, batch, break, and assessment records without copying curriculum records.

### Operational state: D1

Local D1 now owns programme and batch operating configuration, public break dates, individual event overrides, batch-specific acceleration cycles, explicit assessment events, and the write audit trail.

The former weekly compulsory Topic Test model is retired operationally for the Year 12 A-Level Maths 2026–27 scheduler. Formal assessments are now explicit dated assessment events. The legacy `topic_test_*` columns remain temporarily for backward compatibility and are not used to generate, render, or count weekly Topic Tests.

## Actual local D1 schema

The initial migration is `migrations/a-level-scheduler/0001_initial_schema.sql`. It creates:

- `programme_instances`: programme/year identity, taster, start, target completion, status, timestamps, unique by programme and academic year;
- `batches`: recurring teaching/revision rules plus retained legacy Topic Test columns and timestamps, unique by programme instance and batch key;
- `programme_breaks`: public break range and acceleration flag, unique by programme instance and break key;
- `event_overrides`: one override per batch, stable lesson ID, and event type, with event-type validation;
- `acceleration_cycles`: one enabled/disabled cycle per batch and stable lesson ID; and
- `schedule_audit_log`: actor, action, entity, before/after JSON, and timestamp.

The additive migration `migrations/a-level-scheduler/0002_assessment_events.sql` creates `assessment_events`, a scheduler-only table for explicit monthly tests and mock-paper events. It stores stable assessment keys, batch reference, bounded assessment type, label, date, start/end time, optional mock cycle, optional paper identifier, optional coverage note, and timestamps. It does not store marks, scores, student results, question banks, assessment content, grading, automatic marking, learning analytics, or generic workflow state.

Foreign keys and useful lookup indexes are included. Student, parent, resource, payment, and attendance tables are excluded.

The idempotent local seed is `scripts/a-level-scheduler/seed-2026-27.sql`. It seeds one programme, two batches, Christmas and Easter, and inserts any missing approved assessment events per batch. It does not seed event overrides or acceleration cycles. Re-running the seed updates the programme target, but assessment defaults are insert-missing-only by `batch_id` plus `assessment_key`: existing assessment events are never reset by seed reruns, so staff-rescheduled dates and times remain authoritative after initial creation.

## Actual route contract

Read routes:

- `GET /api/a-level-scheduler/2026-27/state` — public, read-only schedule DTO;
- `GET /api/a-level/me` — authenticated, allow-listed A-Level principal DTO without email;
- `GET /api/staff/a-level-scheduler/2026-27/state` — current staff operational state.

Staff write routes:

- `PATCH /api/staff/a-level-scheduler/2026-27/programme`;
- `PATCH /api/staff/a-level-scheduler/2026-27/batch`;
- `PUT` or `DELETE /api/staff/a-level-scheduler/2026-27/event-override`;
- `PATCH /api/staff/a-level-scheduler/2026-27/assessment-event`;
- `PUT` or `DELETE /api/staff/a-level-scheduler/2026-27/acceleration`.

Every write validates the academic year, writable fields, batch, stable lesson ID or assessment key, event type where relevant, dates, time ranges, and operation-specific data on the server. Successful writes and their audit insert are submitted in the same D1 batch. Browser-safe responses do not expose SQL error details.

## Read-only data boundary

The public read-only response contains only:

- programme ID, academic year, taster date, start date, target completion date, and status;
- batch key/display name and recurring teaching and revision/consolidation rules;
- public break key/name/date range;
- event override fields required to render the current schedule; and
- enabled acceleration-cycle fields required to render the current teaching/revision schedule; and
- explicit assessment-event fields required to render the assessment schedule.

It does not return database IDs, override reasons, audit records, actor identifiers, internal notes, tutor costs, authentication data, Classkick or Zoom data, resource URLs, or resource tokens.

## Staff authentication and local write guard

Routes under `/api/a-level/me` and `/api/staff/a-level-scheduler/*` deny deployed access unless the Cloudflare Access JWT has been validated by `@cloudflare/pages-plugin-cloudflare-access`. Deployed validation requires both server-side Pages environment variables:

- `ACCESS_DOMAIN`
- `ACCESS_AUD`

Missing or invalid configuration returns `503` and fails closed. Preview and Production may use different Access audience values. Actual values must be configured in the relevant Pages environment and must not be committed. They must not be placed in client-side JavaScript or returned to the browser merely to perform authentication.

### Gate 2: A-Level application allow-list

Cloudflare Access authentication is Gate 1. Gate 2 resolves the normalised verified email (`trim()` then lowercase) against the dedicated `A_LEVEL_USERS` map. This map is separate from Mathematics workspace users and contains only the approved A-Level users. Each entry defines a durable `code`, display `label`, and supported role (`viewer`, `editor`, or `admin`). Authenticated but unmapped users receive `403`.

- `viewer`: may read the authenticated A-Level identity and schedule views;
- `editor`: has viewer access and may create, update, delete, and reset individual teaching and revision/consolidation event overrides, and may update the date/start/end time for existing assessment events;
- `admin`: has editor access and may also change programme configuration, recurring batch rules, and acceleration cycles.

`GET /api/a-level/me` returns only the mapped `code`, `label`, and `role`. It does not return email or expose the allow-list. The staff page shows the mapped label, enables event editing for editors and admins, and shows programme/batch/acceleration controls only to admins. Server-side endpoint permission checks remain authoritative.

For authenticated admin writes, `actor_identifier` is the resolved principal's durable `code`. Client request bodies, query strings, browser-supplied headers, local storage, and form fields are never used as identity. A validated Access request without a mapped principal is denied.

The local founder-QA bypass remains available only when both conditions hold: the request hostname is exactly `localhost` or `127.0.0.1`, and `SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES` equals the exact value documented in `.dev.vars.example`. The compared values are SHA-256 digests checked without an early exit. Local QA receives a synthetic admin principal; it does not pretend that a real Access JWT exists. Setting the bypass variable on `jothi.uk` or any `pages.dev` hostname cannot enable the bypass.

The actual `.dev.vars` and `.wrangler/` local state are ignored by Git. The enabling value is not present in the Wrangler configuration and must never be configured in preview or production.

## Protected A-Level surface contract

JavaScript is not used to hide or protect either HTML page. The public schedule page and API intentionally remain read-only and public. Step 2C1-B must protect these staff surfaces with the same Cloudflare Access application and policy in each intended environment:

- `/a-level-year12-scheduler.html`
- `/api/staff/a-level-scheduler/*`
- `/api/a-level/me`

The public read-only API and staff APIs retain separate route middleware. The public API returns only the approved schedule DTO and requires no identity. The staff page, staff API, and `/api/a-level/me` use the verified Cloudflare Access principal and `A_LEVEL_USERS` resolver. A mapped viewer, editor, or admin may read authenticated staff schedule data; anonymous staff requests and authenticated but unmapped identities receive `403`.

## Local Wrangler configuration

`wrangler.scheduler.local.jsonc` is labelled local-development-only and contains the local `DB` binding, placeholder UUIDs, root Pages output, the module migration directory, and compatibility date `2026-09-06`. It is not production configuration.

Wrangler 4.129.0 accepts this configuration for local D1 migration and seed commands. Its `pages dev` command does not accept a custom `--config` path, so local Pages QA uses equivalent explicit `--d1`, compatibility, port, and persistence flags. Local QA commands do not use remote mode.

## Dashboard-managed Pages D1 binding contract

Deployment remains dashboard-managed for Pages project `jothi2026`. No production Wrangler file, Worker deployment configuration, or deployment workflow is introduced.

The required Pages binding is:

- variable name: `DB`
- database: `jothi-a-level-scheduler`

Step 2C1-B will initially add this binding only to the **Preview** environment. The Production binding must wait for the later controlled production gate. The real database UUID is deliberately absent from committed Wrangler configuration.

## Step 2C1-A provisioning record

- real database: `jothi-a-level-scheduler`
- region: Western Europe (`WEUR`)
- migration applied: `0001_initial_schema.sql`
- baseline seed applied: `scripts/a-level-scheduler/seed-2026-27.sql`
- seed rerun result: idempotent, zero additional rows
- Access JWT validation code: prepared, not deployed
- local bypass: restricted to localhost and exact QA value
- audit actor: resolved A-Level principal code for deployed admin writes
- remote baseline: one programme, two batches, two breaks, zero overrides, zero acceleration cycles

## Assessment-event operating model

The scheduler generates only weekly teaching and weekly revision/consolidation cycle events. Assessment scheduling is separate from curriculum-cycle generation.

The approved formal-assessment rhythm is represented by real rows in `assessment_events` only:

- six monthly Topic Tests, each one hour;
- midway mock Paper 1 Pure Mathematics, two hours;
- midway mock Paper 2 Statistics and Mechanics, one hour fifteen minutes;
- final mock Paper 1 Pure Mathematics, two hours; and
- final mock Paper 2 Statistics and Mechanics, one hour fifteen minutes.

If no assessment dates have been loaded, the public and staff schedule views show no invented assessments. They do not manufacture cancelled or blank weekly Topic Tests.

The fixed assessment identities for each batch are:

- `october-monthly-test` on `2026-10-30`, `19:00`-`20:00`;
- `november-monthly-test` on `2026-11-27`, `19:00`-`20:00`;
- `december-monthly-test` on `2026-12-18`, `19:00`-`20:00`;
- `midway-mock-paper-1` on `2027-01-15`, `19:00`-`21:00`;
- `midway-mock-paper-2` on `2027-01-22`, `19:00`-`20:15`;
- `february-monthly-test` on `2027-02-26`, `19:00`-`20:00`;
- `march-monthly-test` on `2027-03-19`, `19:00`-`20:00`;
- `april-monthly-test` on `2027-04-30`, `19:00`-`20:00`;
- `final-mock-paper-1` on `2027-05-14`, `19:00`-`21:00`;
- `final-mock-paper-2` on `2027-05-21`, `19:00`-`20:15`.

Staff may move the stored date, start time, and end time for an existing assessment event. They cannot create or delete assessment events through the scheduler interface, and cannot change the assessment key, type, cycle, paper, label, coverage note, or batch assignment through that route. Each batch has its own assessment rows, so changing `BATCH-1` does not change `BATCH-2`. The seed is safe to rerun for missing approved assessment rows only; it must not be used as a reset mechanism for staff-adjusted assessment timings.

Supervised programme hours are calculated from actual rendered events:

```text
teaching duration
  + revision/consolidation duration
  + explicit assessment-event duration
```

The calculation is event-derived, not hard-coded to 96.5 hours. With the complete approved assessment set loaded, the expected total is:

```text
56 teaching hours
+ 28 revision/consolidation hours
+ 6 monthly-test hours
+ 3.25 midway-mock hours
+ 3.25 final-mock hours
= 96.5 planned supervised hours
```

This release does not create a generic assessment-management platform. It adds the fixed scheduler representation needed for dated assessment events. Destructive cleanup of retained legacy `topic_test_*` database columns is explicitly deferred.

No Pages binding, Access application, Access policy, Preview deployment, or Production change was made in Step 2C1-A.

## Classkick and protected resources

Classkick and other resource URLs are not part of either schedule-state response and are not stored in scheduler D1. They will eventually live in a separate protected resource layer.

Schedule records reference stable `lesson_id` only. This preserves:

```text
one lesson pill
    -> many batches
    -> many academic years
    -> one protected resource record later
```

## Step 2C1-B gate

**STEP 2C1-B REQUIRES:**

- Preview D1 binding (`DB` to `jothi-a-level-scheduler`);
- Preview Access configuration;
- Access team domain;
- Preview Access audience value;
- feature-branch push; and
- protected Preview deployment QA.

Production binding, production environment changes, merge/deployment, public navigation, and indexing remain later controlled gates.

Production work should also define concurrency/conflict handling and an atomic multi-entity workflow for the staff configuration regeneration sequence.
