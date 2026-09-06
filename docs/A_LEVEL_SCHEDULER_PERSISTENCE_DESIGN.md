# A-Level Scheduler Persistence Design

Status: design only. This document defines the intended public/staff and persistence boundaries. It does not create infrastructure, APIs, authentication, D1 databases, or migrations.

## Boundary rule

> Hiding a staff control with CSS or JavaScript is not access control.

The public schedule is a genuinely read-only application view. It must not import or initialise staff editing behaviour, and its HTML must not contain hidden staff controls. Later authentication will protect the staff page and staff API. Sensitive URLs or operational data must never be sent to a public browser and merely hidden.

Both views use the same curriculum library, academic-year configuration, scheduling engine, lesson sequence, and stable lesson IDs:

- `data/a-level-maths/year12-curriculum.json`
- `data/a-level-maths/2026-27.json`
- `a-level-scheduler-engine.js`
- `a-level-scheduler-view.js`

The public controller is read-only. The staff controller owns configuration, regeneration, in-memory rescheduling, and optional holiday scheduling interactions.

## Recommended future architecture

```text
Public browser
    ↓ GET
Public schedule API
    ↓
Cloudflare Pages Function
    ↓
D1 schedule data

Staff browser
    ↓ authenticated GET/POST/PATCH/DELETE
Staff API
    ↓
Cloudflare Pages Function
    ↓
D1 schedule data
```

Cloudflare Access should later protect the staff route and every staff API operation. Public reads must use a separately defined response contract rather than returning staff records and filtering them in the browser.

## Data ownership

### Curriculum library: Git

`data/a-level-maths/year12-curriculum.json` remains version-controlled and is the source for:

- stable lesson IDs;
- lesson titles and sequence;
- curriculum duration; and
- future generic resource references only.

Operational schedule edits must not be written into curriculum JSON.

### Academic-year default configuration: Git for MVP

`data/a-level-maths/2026-27.json` remains the baseline/default configuration during the MVP. A future production workflow may seed an academic-year programme record from it. The file is not the future write target for day-to-day schedule operation.

### Operational schedule state: D1 later

The following mutable state should eventually live in D1:

- individual event reschedules;
- schedule override dates and times;
- acceleration cycles;
- batch-specific operating changes; and
- the published/current schedule state.

## Lean proposed D1 schema

No SQL migration is created in this step. Field types, constraints, indexes, retention, and publication workflow should be finalised when persistence is implemented.

### `programme_instances`

- `id`
- `programme_id`
- `academic_year`
- `programme_start_date`
- `target_completion_date`
- `status`
- `created_at`
- `updated_at`

Recommended identity rule: one programme instance per `programme_id` and `academic_year` unless a later business requirement introduces parallel cohorts.

### `batches`

- `id`
- `programme_instance_id`
- `batch_key`
- `display_name`
- `teaching_weekday`
- `teaching_start`
- `teaching_end`
- `revision_weekday`
- `revision_start`
- `revision_end`
- `topic_test_weekday`
- `topic_test_start`
- `topic_test_end`

`programme_instance_id` links to `programme_instances`. `batch_key` preserves stable values such as `BATCH-1` independently of the parent-facing display name.

### `event_overrides`

- `id`
- `batch_id`
- `lesson_id`
- `event_type`
- `original_date`
- `override_date`
- `override_start`
- `override_end`
- `reason`
- `created_at`
- `updated_at`

Recommended uniqueness rule: one active override per `batch_id`, `lesson_id`, and `event_type`. `lesson_id` references the Git-owned curriculum identity; curriculum content is not copied into this table.

### `acceleration_cycles`

- `id`
- `batch_id`
- `lesson_id`
- `break_key`
- `teaching_date`
- `teaching_start`
- `teaching_end`
- `revision_date`
- `revision_start`
- `revision_end`
- `topic_test_date`
- `topic_test_start`
- `topic_test_end`
- `enabled`
- `created_at`
- `updated_at`

### `schedule_audit_log`

- `id`
- `actor_identifier`
- `action`
- `entity_type`
- `entity_id`
- `before_json`
- `after_json`
- `created_at`

The audit log belongs only to the protected staff boundary. It must never be returned by the public schedule API.

Student, enrolment, and resource tables are deliberately excluded from this phase.

## Future public API contract

Conceptual read-only endpoint:

```http
GET /api/programmes/a-level-maths/year12/2026-27/schedule
```

The response may contain only:

- programme title;
- programme commitment;
- public break dates;
- batch display names;
- lesson titles;
- teaching, revision, and Topic Test dates and times; and
- public schedule status.

It must not return:

- Classkick URLs;
- Zoom URLs;
- internal notes;
- tutor costs;
- staff identities;
- audit history;
- resource tokens; or
- authentication data.

The public endpoint should expose an explicit public response model assembled server-side. It must not serialise a staff/domain record and rely on client-side deletion or hiding.

## Future staff API contract

Conceptual protected operations:

- `GET` the current schedule and staff-operational state;
- `PATCH` an individual event override;
- `DELETE` an event override to reset that event;
- `POST` an acceleration cycle; and
- `PATCH` programme or batch configuration.

All staff operations will require authenticated staff access. Authorisation, validation, concurrency handling, audit writes, and publication rules must be designed before implementation. No endpoint is implemented in this step.

## Classkick and protected resources

Classkick and other resource URLs are not part of the public schedule API. They should eventually live in a separate protected resource layer.

Schedule records reference only the stable `lesson_id`. This preserves the relationship:

```text
one lesson pill
    → many batches
    → many academic years
    → one protected resource record later
```

The protected resource record can later associate a stable lesson ID with authorised resources without duplicating curriculum or schedule records and without shipping sensitive links to the public browser.

## Deferred work

This design deliberately defers Cloudflare configuration, Pages Functions, D1 creation, migrations, Cloudflare Access, authentication, API endpoints, student/enrolment records, and protected resource records.
