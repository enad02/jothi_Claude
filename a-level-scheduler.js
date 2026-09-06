import {
  EVENT_LABELS,
  WEEKDAYS,
  applyEventOverrides,
  clearEventOverrides,
  generateSchedule,
  resetEventOverride,
  upsertEventOverride,
  validateEventOverride
} from "./a-level-scheduler-engine.js";
import {
  activateScheduleTab,
  escapeHtml,
  renderScheduleView,
  resolveActiveBatchId
} from "./a-level-scheduler-view.js";

const curriculumPath = "./data/a-level-maths/year12-curriculum.json";
const programmePath = "./data/a-level-maths/2026-27.json";

const elements = {
  form: document.querySelector("#scheduler-setup"),
  programmeStart: document.querySelector("#programme-start"),
  targetCompletion: document.querySelector("#target-completion"),
  closureControls: document.querySelector("#closure-controls"),
  batchControls: document.querySelector("#batch-controls"),
  accelerationControls: document.querySelector("#acceleration-controls"),
  batchTabs: document.querySelector("#batch-tabs"),
  error: document.querySelector("#scheduler-error"),
  generationNote: document.querySelector("#generation-note"),
  eventEditor: document.querySelector("#event-editor"),
  eventEditForm: document.querySelector("#event-edit-form"),
  eventEditorType: document.querySelector("#event-editor-type"),
  eventEditorLesson: document.querySelector("#event-editor-lesson"),
  eventDate: document.querySelector("#event-override-date"),
  eventStart: document.querySelector("#event-override-start"),
  eventEnd: document.querySelector("#event-override-end"),
  eventErrors: document.querySelector("#event-editor-errors"),
  eventWarnings: document.querySelector("#event-editor-warnings"),
  warningConfirm: document.querySelector("#event-warning-confirm")
};

let curriculum;
let currentProgramme;
let activeBatchId;
let generatedSchedule;
let displayedSchedule;
let eventOverrides = [];
let editingEvent = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function weekdayOptions(selected) {
  return WEEKDAYS.map((weekday) => (
    `<option value="${weekday}"${weekday === selected ? " selected" : ""}>${weekday}</option>`
  )).join("");
}

function renderSetup(programme) {
  elements.programmeStart.value = programme.programme_start;
  elements.targetCompletion.value = programme.target_completion;

  elements.closureControls.innerHTML = `
    <h3 class="setup-subheading">Protected closures</h3>
    ${programme.closures.map((closure) => `
      <div class="closure-config" data-closure-id="${escapeHtml(closure.break_id)}">
        <h4>${escapeHtml(closure.label)}</h4>
        <div class="setup-grid setup-grid-programme">
          <label>${escapeHtml(closure.label)} start
            <input type="date" data-field="start_date" value="${escapeHtml(closure.start_date)}" required />
          </label>
          <label>${escapeHtml(closure.label)} end
            <input type="date" data-field="end_date" value="${escapeHtml(closure.end_date)}" required />
          </label>
        </div>
      </div>
    `).join("")}
  `;

  elements.batchControls.innerHTML = `
    <h3 class="setup-subheading">Weekly batch pattern</h3>
    ${programme.batches.map((batch) => `
      <div class="batch-config" data-batch-config="${escapeHtml(batch.batch_id)}">
        <h4>${escapeHtml(batch.name)}</h4>
        <div class="setup-grid">
          ${weeklyEventControl("Teaching", "teaching", batch.teaching)}
          ${weeklyEventControl("Revision", "revision", batch.revision)}
          ${weeklyEventControl("Topic Test", "topic_test", batch.topic_test)}
        </div>
      </div>
    `).join("")}
  `;

  elements.accelerationControls.innerHTML = `
    <h3 class="setup-subheading">Optional holiday scheduling</h3>
    ${programme.batches.map((batch) => renderAccelerationEditors(programme, batch)).join("")}
  `;
}

function weeklyEventControl(label, eventName, definition) {
  return `
    <fieldset class="weekly-event" data-event="${eventName}">
      <legend>${label}</legend>
      <label>Weekday
        <select data-field="weekday">${weekdayOptions(definition.weekday)}</select>
      </label>
      <label>Start time
        <input type="time" data-field="start_time" value="${escapeHtml(definition.start_time)}" required />
      </label>
    </fieldset>
  `;
}

function readDateTime(value) {
  const [date = "", startTime = ""] = value.split("T");
  return { date, start_time: startTime };
}

function readProgrammeFromForm() {
  const programme = clone(currentProgramme);
  programme.programme_start = elements.programmeStart.value;
  programme.target_completion = elements.targetCompletion.value;

  for (const closureElement of elements.closureControls.querySelectorAll("[data-closure-id]")) {
    const closure = programme.closures.find((item) => item.break_id === closureElement.dataset.closureId);
    closure.start_date = closureElement.querySelector('[data-field="start_date"]').value;
    closure.end_date = closureElement.querySelector('[data-field="end_date"]').value;
  }

  for (const batchElement of elements.batchControls.querySelectorAll("[data-batch-config]")) {
    const batch = programme.batches.find((item) => item.batch_id === batchElement.dataset.batchConfig);
    for (const eventElement of batchElement.querySelectorAll("[data-event]")) {
      const eventName = eventElement.dataset.event;
      batch[eventName].weekday = eventElement.querySelector('[data-field="weekday"]').value;
      batch[eventName].start_time = eventElement.querySelector('[data-field="start_time"]').value;
    }
  }

  for (const batch of programme.batches) {
    batch.acceleration_overrides = [];
    for (const editor of elements.accelerationControls.querySelectorAll(`[data-acceleration-batch="${batch.batch_id}"]`)) {
      const enabled = editor.querySelector('[data-field="enabled"]').checked;
      if (!enabled) {
        continue;
      }

      batch.acceleration_overrides.push({
        batch_id: batch.batch_id,
        break_id: editor.dataset.accelerationBreak,
        enabled: true,
        teaching: readDateTime(editor.querySelector('[data-field="teaching"]').value),
        revision: readDateTime(editor.querySelector('[data-field="revision"]').value),
        topic_test: readDateTime(editor.querySelector('[data-field="topic_test"]').value)
      });
    }
  }

  return programme;
}

function findOverride(batch, breakId) {
  return (batch.acceleration_overrides || []).find((override) => override.break_id === breakId) || null;
}

function toDateTimeValue(event) {
  return event?.date && event?.start_time ? `${event.date}T${event.start_time}` : "";
}

function renderAccelerationEditors(programme, batch) {
  return `
    <details class="acceleration-panel">
      <summary>Optional holiday acceleration · ${escapeHtml(batch.name)}</summary>
      <div class="acceleration-editor-grid">
        ${programme.closures.map((closure) => {
          const override = findOverride(batch, closure.break_id);
          return `
            <section class="acceleration-break" data-acceleration-batch="${escapeHtml(batch.batch_id)}" data-acceleration-break="${escapeHtml(closure.break_id)}">
              <h4>${escapeHtml(closure.label)}</h4>
              <label class="enable-row">
                <input type="checkbox" data-field="enabled"${override?.enabled ? " checked" : ""} />
                Agreed and enabled for this batch
              </label>
              <label>Teaching date/time
                <input type="datetime-local" data-field="teaching" value="${escapeHtml(toDateTimeValue(override?.teaching))}" />
              </label>
              <label>Revision date/time
                <input type="datetime-local" data-field="revision" value="${escapeHtml(toDateTimeValue(override?.revision))}" />
              </label>
              <label>Topic Test date/time
                <input type="datetime-local" data-field="topic_test" value="${escapeHtml(toDateTimeValue(override?.topic_test))}" />
              </label>
            </section>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function hasEventOverride(batchId, lessonId, eventType) {
  return eventOverrides.some((override) => (
    override.batch_id === batchId &&
    override.lesson_id === lessonId &&
    override.event_type === eventType
  ));
}

function activateTab(batchId, focus = false) {
  activeBatchId = batchId;
  activateScheduleTab(
    elements.batchTabs,
    batchId,
    displayedSchedule,
    currentProgramme,
    { showAcceleration: true },
    focus
  );
}

function renderCurrentSchedule(note) {
  displayedSchedule = applyEventOverrides(generatedSchedule, curriculum, currentProgramme, eventOverrides);
  activeBatchId = resolveActiveBatchId(displayedSchedule, activeBatchId);
  elements.batchTabs.innerHTML = renderScheduleView(displayedSchedule, currentProgramme, activeBatchId, {
    editableEvents: true,
    hasEventOverride,
    lessonColumnLabel: "Lesson pill",
    showAcceleration: true,
    showValidation: true
  });
  elements.generationNote.textContent = note;
}

function generateAndRender(programme, note) {
  try {
    if (programme.closures.some((closure) => closure.end_date < closure.start_date)) {
      throw new Error("Each protected closure must end on or after its start date.");
    }
    generatedSchedule = generateSchedule(curriculum, programme);
    renderCurrentSchedule(note);
    elements.error.hidden = true;
    elements.error.textContent = "";
  } catch (error) {
    elements.error.textContent = error.message;
    elements.error.hidden = false;
    elements.generationNote.textContent = "Schedule not generated";
  }
}

function findCycle(schedule, batchId, lessonId) {
  return schedule.batches
    .find((batch) => batch.batch_id === batchId)
    ?.cycles.find((cycle) => cycle.lesson_id === lessonId);
}

function hideEditorFeedback() {
  elements.eventErrors.hidden = true;
  elements.eventErrors.textContent = "";
  elements.eventWarnings.hidden = true;
  elements.eventWarnings.querySelector("ul").innerHTML = "";
  elements.warningConfirm.checked = false;
}

function openEventEditor(trigger) {
  const batchId = trigger.dataset.batchId;
  const lessonId = trigger.dataset.lessonId;
  const eventType = trigger.dataset.eventType;
  const cycle = findCycle(displayedSchedule, batchId, lessonId);
  if (!cycle || !EVENT_LABELS[eventType]) {
    return;
  }

  editingEvent = {
    batch_id: batchId,
    lesson_id: lessonId,
    cycle: Number(trigger.dataset.cycle),
    event_type: eventType
  };
  elements.eventEditorType.textContent = EVENT_LABELS[eventType];
  elements.eventEditorLesson.textContent = cycle.title;
  elements.eventDate.value = cycle[eventType].date;
  elements.eventStart.value = cycle[eventType].start_time;
  elements.eventEnd.value = cycle[eventType].end_time;
  hideEditorFeedback();
  elements.eventEditor.showModal();
}

function showEditorFeedback(validation) {
  elements.eventErrors.hidden = validation.errors.length === 0;
  elements.eventErrors.textContent = validation.errors.join(" ");
  elements.eventWarnings.hidden = validation.warnings.length === 0;
  elements.eventWarnings.querySelector("ul").innerHTML = validation.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (
    eventOverrides.length > 0 &&
    !window.confirm("Regenerating will clear individual rescheduled dates.")
  ) {
    return;
  }

  eventOverrides = clearEventOverrides();
  currentProgramme = readProgrammeFromForm();
  generateAndRender(currentProgramme, "Schedule regenerated");
});

elements.batchTabs.addEventListener("click", (event) => {
  const eventTrigger = event.target.closest("[data-event-edit]");
  if (eventTrigger) {
    openEventEditor(eventTrigger);
    return;
  }

  const tab = event.target.closest('[role="tab"]');
  if (tab) {
    activateTab(tab.dataset.tabBatch);
  }
});

elements.batchTabs.addEventListener("keydown", (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    return;
  }

  const tabs = [...elements.batchTabs.querySelectorAll('[role="tab"]')];
  const currentIndex = tabs.indexOf(tab);
  let nextIndex = currentIndex;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  event.preventDefault();
  activateTab(tabs[nextIndex].dataset.tabBatch, true);
});

elements.eventEditForm.addEventListener("input", (event) => {
  if (event.target === elements.warningConfirm) {
    return;
  }
  elements.warningConfirm.checked = false;
  elements.eventErrors.hidden = true;
  elements.eventWarnings.hidden = true;
});

elements.eventEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editingEvent) {
    return;
  }

  const override = {
    ...editingEvent,
    new_date: elements.eventDate.value,
    new_start_time: elements.eventStart.value,
    new_end_time: elements.eventEnd.value
  };
  const validation = validateEventOverride(override, generatedSchedule, currentProgramme, eventOverrides);
  showEditorFeedback(validation);

  if (validation.errors.length > 0) {
    return;
  }
  if (validation.warnings.length > 0 && !elements.warningConfirm.checked) {
    return;
  }

  eventOverrides = upsertEventOverride(eventOverrides, override);
  elements.eventEditor.close();
  renderCurrentSchedule(`${EVENT_LABELS[override.event_type]} rescheduled for ${findCycle(displayedSchedule, override.batch_id, override.lesson_id).title}`);
});

elements.eventEditor.addEventListener("click", (event) => {
  const action = event.target.closest("[data-editor-action]")?.dataset.editorAction;
  if (action === "cancel") {
    elements.eventEditor.close();
  }
  if (action === "reset" && editingEvent) {
    eventOverrides = resetEventOverride(eventOverrides, editingEvent);
    elements.eventEditor.close();
    renderCurrentSchedule("Event restored to the original schedule");
  }
});

async function initialise() {
  try {
    const [curriculumResponse, programmeResponse] = await Promise.all([
      fetch(curriculumPath),
      fetch(programmePath)
    ]);
    if (!curriculumResponse.ok || !programmeResponse.ok) {
      throw new Error("The schedule files could not be loaded.");
    }

    curriculum = await curriculumResponse.json();
    currentProgramme = await programmeResponse.json();
    activeBatchId = currentProgramme.batches[0]?.batch_id;
    renderSetup(currentProgramme);
    generateAndRender(currentProgramme, "Schedule ready");
  } catch (error) {
    elements.error.textContent = `${error.message} Open this page through the site server.`;
    elements.error.hidden = false;
    elements.generationNote.textContent = "Unable to load schedule";
  }
}

initialise();
