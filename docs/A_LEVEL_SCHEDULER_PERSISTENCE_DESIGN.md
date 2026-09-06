# A-Level Scheduler Persistence Design

Status: **LOCAL PERSISTENCE PROTOTYPE IMPLEMENTED**. The implementation is local-only. No production or preview database, binding, authentication policy, deployment, or remote Cloudflare resource has been created.

## Boundary rule

> Hiding a staff control with CSS or JavaScript is not access control.

The public schedule is a genuinely read-only application. It has its own controller, does not initialise staff editing behaviour, and contains no staff controls in its DOM. Staff writes are implemented only behind a local kill switch pending Cloudflare Access. Sensitive operational data and protected URLs must never be sent to the public browser and merely hidden.

Both views continue to share:

- the Git-owned curriculum library at `data/a-level-maths/year12-curriculum.json`;
- the MVP baseline at `data/a-level-maths/2026-27.json`;
- `a-level-scheduler-engine.js` for schedule generation; and
- `a-level-scheduler-view.js` for shared rendering helpers.

D1 stores operational scheduling state only. It does not duplicate lesson titles, lesson sequence, or curriculum duration.

## Implemented local architecture

```text
Public browser
    -> GET public state API
    -> Cloudflare Pages Function
    -> local D1 operational state

Staff browser
    -> GET / guarded writes
    -> Cloudflare Pages Functions
    -> local D1 operational state + audit log
```

The public and staff controllers combine the API state with the same Git curriculum and run the same scheduling engine. The public controller shows a restrained unavailable message instead of silently falling back to potentially stale baseline data.

## Data ownership

### Curriculum library: Git

`data/a-level-maths/year12-curriculum.json` remains the source for stable lesson IDs, titles, sequence, and two-hour curriculum duration. Operational changes never write to this file.

### Academic-year baseline: Git

`data/a-level-maths/2026-27.json` remains the approved seed/default source. The local seed creates the corresponding operational programme, batch, and break records without copying curriculum records.

### Operational state: D1

Local D1 now owns programme and batch operating configuration, public break dates, individual event overrides, batch-specific acceleration cycles, and the write audit trail.

## Actual local D1 schema

The initial migration is `migrations/a-level-scheduler/0001_initial_schema.sql`. It creates:

- `programme_instances`: programme/year identity, taster, start, target completion, status, timestamps, unique by programme and academic year;
- `batches`: recurring teaching/revision/Topic Test rules and timestamps, unique by programme instance and batch key;
- `programme_breaks`: public break range and acceleration flag, unique by programme instance and break key;
- `event_overrides`: one override per batch, stable lesson ID, and event type, with event-type validation;
- `acceleration_cycles`: one enabled/disabled cycle per batch and stable lesson ID; and
- `schedule_audit_log`: actor, action, entity, before/after JSON, and timestamp.

Foreign keys and useful lookup indexes are included. Student, parent, resource, payment, and attendance tables are excluded.

The idempotent local seed is `scripts/a-level-scheduler/seed-2026-27.sql`. It seeds one programme, two batches, Christmas and Easter, and no event overrides or acceleration cycles.

## Actual route contract

Read routes:

- `GET /api/a-level-scheduler/2026-27/state` — explicit public DTO only;
- `GET /api/staff/a-level-scheduler/2026-27/state` — current staff operational state.

Staff write routes:

- `PATCH /api/staff/a-level-scheduler/2026-27/programme`;
- `PATCH /api/staff/a-level-scheduler/2026-27/batch`;
- `PUT` or `DELETE /api/staff/a-level-scheduler/2026-27/event-override`;
- `PUT` or `DELETE /api/staff/a-level-scheduler/2026-27/acceleration`.

Every write validates the academic year, writable fields, batch, stable lesson ID, event type, dates, time ranges, and operation-specific data on the server. Successful writes and their audit insert are submitted in the same D1 batch. Browser-safe responses do not expose SQL error details.

## Public data boundary

The public response contains only:

- programme ID, academic year, taster date, start date, target completion date, and status;
- batch key/display name and recurring teaching, revision, and Topic Test rules;
- public break key/name/date range;
- event override fields required to render the current schedule; and
- enabled acceleration-cycle fields required to render the current schedule.

It does not return database IDs, override reasons, audit records, actor identifiers, internal notes, tutor costs, authentication data, Classkick or Zoom data, resource URLs, or resource tokens.

## Local write guard

All staff write Functions deny access by default. A write is permitted only when `SCHEDULER_ALLOW_UNAUTHENTICATED_WRITES` equals the exact local founder-QA value documented in `.dev.vars.example`. The compared values are SHA-256 digests checked without an early exit.

The actual `.dev.vars` and `.wrangler/` local state are ignored by Git. The enabling value is not present in the Wrangler configuration and must never be configured in preview or production. Staff GET remains locally available for this prototype; Cloudflare Access protection is Step 2C.

## Local Wrangler configuration

`wrangler.scheduler.local.jsonc` is labelled local-development-only and contains the local `DB` binding, placeholder UUIDs, root Pages output, the module migration directory, and compatibility date `2026-09-06`. It is not production configuration.

Wrangler 4.129.0 accepts this configuration for local D1 migration and seed commands. Its `pages dev` command does not accept a custom `--config` path, so local Pages QA uses equivalent explicit `--d1`, compatibility, port, and persistence flags. No command uses remote mode.

## Classkick and protected resources

Classkick and other resource URLs are not part of either schedule-state response and are not stored in scheduler D1. They will eventually live in a separate protected resource layer.

Schedule records reference stable `lesson_id` only. This preserves:

```text
one lesson pill
    -> many batches
    -> many academic years
    -> one protected resource record later
```

## Remaining Step 2C work

The following work is not completed:

- create the real Cloudflare D1 resource;
- add production and preview bindings;
- protect the staff route and API with Cloudflare Access;
- derive the audit actor identity from the authenticated user;
- remove the local-only unauthenticated write bypass;
- run controlled production migration and seed procedures;
- perform a controlled deployment; and
- decide public indexing, navigation, and publication timing.

Production work should also define concurrency/conflict handling and an atomic multi-entity workflow for the staff configuration regeneration sequence.
