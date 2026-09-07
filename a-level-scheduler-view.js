import { EVENT_LABELS, lessonPillLabel } from "./a-level-scheduler-engine.js";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});
const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});
const weekdayDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString, includeWeekday = false) {
  const formatter = includeWeekday ? weekdayDateFormatter : dateFormatter;
  return formatter.format(new Date(`${dateString}T00:00:00Z`));
}

function formatLongDate(dateString) {
  return longDateFormatter.format(new Date(`${dateString}T00:00:00Z`));
}

export function resolveActiveBatchId(result, requestedBatchId) {
  return result.batches.some((batch) => batch.batch_id === requestedBatchId)
    ? requestedBatchId
    : result.batches[0]?.batch_id;
}

export function renderProgrammeCommitment(progress, programme, { showAcceleration = false } = {}) {
  const values = [
    ["Curriculum lessons", progress.lessons_scheduled],
    ["Curriculum teaching", `${progress.core_teaching_hours}h`],
    ["Supervised revision", `${progress.revision_hours}h`],
    ["Topic Tests", `${progress.topic_test_hours}h`],
    ["Supervised student hours", `${progress.total_supervised_hours}h`]
  ];

  const dateValues = [
    ["Taster", formatLongDate(programme.taster_date)],
    ["Programme start", formatLongDate(programme.programme_start)],
    ["Forecast completion", formatLongDate(progress.forecast_completion_date)]
  ];
  if (showAcceleration) {
    dateValues.push(["Acceleration cycles used", progress.acceleration_cycles_used]);
  }

  return `
    <section class="programme-commitment" aria-label="Programme commitment">
      <div class="commitment-heading">
        <h3>Programme commitment</h3>
        <span class="deadline-status is-status-${progress.deadline_status.toLowerCase().replaceAll(" ", "-")}">${escapeHtml(progress.deadline_status)}</span>
      </div>
      <dl class="commitment-grid">
        ${values.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}
      </dl>
      <dl class="programme-dates${showAcceleration ? "" : " is-public"}">
        ${dateValues.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function findAcceleration(batch, breakId) {
  return (batch?.acceleration_overrides || []).find((override) => override.break_id === breakId) || null;
}

function renderBreaks(programme, batch, { showAcceleration = false } = {}) {
  return `<section class="programme-breaks" aria-label="Programme breaks">
    <h3>Programme breaks</h3>
    <div class="break-grid">
    ${programme.closures.map((closure) => {
      const enabled = Boolean(findAcceleration(batch, closure.break_id)?.enabled);
      return `
        <article class="break-card">
          <strong>${escapeHtml(closure.label)} break</strong>
          <span>${formatLongDate(closure.start_date)} – ${formatLongDate(closure.end_date)}</span>
          ${showAcceleration ? `<small>Optional acceleration: ${enabled ? "Agreed / enabled" : "Not agreed"}</small>` : ""}
        </article>
      `;
    }).join("")}
    </div>
  </section>`;
}

function renderEventCell(cycle, batchId, eventType, options) {
  const event = cycle[eventType];
  if (!options.editableEvents) {
    return `
      <td class="event-time-cell">
        <span class="event-time-static">
          <span class="event-date">${formatDate(event.date, true)}</span>
          <span class="event-time">${event.start_time}–${event.end_time}</span>
        </span>
      </td>
    `;
  }

  const label = EVENT_LABELS[eventType];
  const rescheduled = options.hasEventOverride(batchId, cycle.lesson_id, eventType);
  return `
    <td class="event-time-cell">
      <button
        class="event-time-trigger"
        type="button"
        data-event-edit
        data-batch-id="${escapeHtml(batchId)}"
        data-lesson-id="${escapeHtml(cycle.lesson_id)}"
        data-cycle="${cycle.cycle}"
        data-event-type="${eventType}"
        aria-label="Edit ${label.toLowerCase()} date and time for ${escapeHtml(cycle.title)}"
      >
        <span class="event-date">${formatDate(event.date, true)}</span>
        <span class="event-time">${event.start_time}–${event.end_time}</span>
        ${rescheduled ? '<span class="rescheduled-indicator">Rescheduled</span>' : ""}
      </button>
    </td>
  `;
}

function renderTable(cycles, batchName, batchId, options) {
  return `
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <caption class="visually-hidden">${escapeHtml(batchName)} Year 12 A-Level Maths schedule</caption>
        <colgroup>
          <col class="cycle-column" />
          <col class="event-column" />
          <col class="lesson-column" />
          <col class="event-column" />
          <col class="event-column" />
          <col class="status-column" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Cycle</th>
            <th scope="col">Teaching date/time</th>
            <th scope="col">${options.lessonColumnLabel}</th>
            <th scope="col">Revision date/time</th>
            <th scope="col">Topic Test date/time</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          ${cycles.map((cycle) => `
            <tr>
              <td>${cycle.cycle}</td>
              ${renderEventCell(cycle, batchId, "teaching", options)}
              <td><span class="lesson-pill" data-lesson-id="${escapeHtml(cycle.lesson_id)}">${escapeHtml(lessonPillLabel(cycle))}</span></td>
              ${renderEventCell(cycle, batchId, "revision", options)}
              ${renderEventCell(cycle, batchId, "topic_test", options)}
              <td><span class="status-pill${cycle.status === "Acceleration" ? " is-acceleration" : ""}">${escapeHtml(cycle.status)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderValidation(errors) {
  if (!errors.length) {
    return "";
  }
  return `<ul class="batch-validation">${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`;
}

export function renderScheduleView(result, programme, requestedBatchId, settings = {}) {
  const options = {
    editableEvents: false,
    hasEventOverride: () => false,
    lessonColumnLabel: "Lesson",
    showAcceleration: false,
    showValidation: false,
    ...settings
  };
  const activeBatchId = resolveActiveBatchId(result, requestedBatchId);
  const activeBatch = result.batches.find((batch) => batch.batch_id === activeBatchId);
  const batchById = new Map(programme.batches.map((batch) => [batch.batch_id, batch]));

  return `
    <div class="batch-commitment-host" id="batch-commitment">
      ${renderProgrammeCommitment(activeBatch.progress, programme, options)}
    </div>
    <div class="tab-list" role="tablist" aria-label="Batch schedules">
      ${result.batches.map((batch) => {
        const active = batch.batch_id === activeBatchId;
        return `<button id="tab-${escapeHtml(batch.batch_id)}" type="button" role="tab" aria-selected="${active}" aria-controls="panel-${escapeHtml(batch.batch_id)}" tabindex="${active ? "0" : "-1"}" data-tab-batch="${escapeHtml(batch.batch_id)}">${escapeHtml(batch.name)}</button>`;
      }).join("")}
    </div>
    ${result.batches.map((batch) => {
      const active = batch.batch_id === activeBatchId;
      return `
        <section id="panel-${escapeHtml(batch.batch_id)}" role="tabpanel" aria-labelledby="tab-${escapeHtml(batch.batch_id)}"${active ? "" : " hidden"}>
          ${renderTable(batch.cycles, batch.name, batch.batch_id, options)}
          ${renderBreaks(programme, batchById.get(batch.batch_id), options)}
          ${options.showValidation ? renderValidation(batch.errors) : ""}
        </section>
      `;
    }).join("")}
  `;
}

export function activateScheduleTab(root, batchId, result, programme, settings = {}, focus = false) {
  for (const tab of root.querySelectorAll('[role="tab"]')) {
    const active = tab.dataset.tabBatch === batchId;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) {
      tab.focus();
    }
  }
  for (const panel of root.querySelectorAll('[role="tabpanel"]')) {
    panel.hidden = panel.id !== `panel-${batchId}`;
  }

  const selectedBatch = result?.batches.find((batch) => batch.batch_id === batchId);
  const commitmentHost = root.querySelector("#batch-commitment");
  if (selectedBatch && commitmentHost) {
    commitmentHost.innerHTML = renderProgrammeCommitment(selectedBatch.progress, programme, settings);
  }
}
