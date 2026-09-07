import { applyEventOverrides, generateSchedule } from "./a-level-scheduler-engine.js";
import {
  activateScheduleTab,
  renderScheduleView,
  resolveActiveBatchId
} from "./a-level-scheduler-view.js";
import {
  PUBLIC_SCHEDULER_STATE_URL,
  eventOverridesFromApiState,
  loadSchedulerApiState,
  programmeFromApiState
} from "./a-level-scheduler-public-state.js";

const curriculumPath = "./data/a-level-maths/year12-curriculum.json";
const programmePath = "./data/a-level-maths/2026-27.json";

export function renderPublicSchedule(result, programme, activeBatchId) {
  return renderScheduleView(result, programme, activeBatchId, {
    lessonColumnLabel: "Lesson"
  });
}

export async function initialisePublicSchedule(page = document, load = fetch) {
  const batchTabs = page.querySelector("#batch-tabs");
  const error = page.querySelector("#scheduler-error");
  let schedule;
  let programme;
  let activeBatchId;

  function activateTab(batchId, focus = false) {
    activeBatchId = batchId;
    activateScheduleTab(batchTabs, batchId, schedule, programme, {}, focus);
  }

  batchTabs.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) {
      activateTab(tab.dataset.tabBatch);
    }
  });

  batchTabs.addEventListener("keydown", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    const tabs = [...batchTabs.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(tab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    event.preventDefault();
    activateTab(tabs[nextIndex].dataset.tabBatch, true);
  });

  try {
    const [curriculumResponse, programmeResponse, persistedState] = await Promise.all([
      load(curriculumPath),
      load(programmePath),
      loadSchedulerApiState(PUBLIC_SCHEDULER_STATE_URL, load)
    ]);
    if (!curriculumResponse.ok || !programmeResponse.ok) {
      throw new Error("The schedule files could not be loaded.");
    }

    const curriculum = await curriculumResponse.json();
    const baselineProgramme = await programmeResponse.json();
    programme = programmeFromApiState(persistedState, baselineProgramme);
    const generatedSchedule = generateSchedule(curriculum, programme);
    schedule = applyEventOverrides(
      generatedSchedule,
      curriculum,
      programme,
      eventOverridesFromApiState(persistedState)
    );
    activeBatchId = resolveActiveBatchId(schedule, programme.batches[0]?.batch_id);
    batchTabs.innerHTML = renderPublicSchedule(schedule, programme, activeBatchId);
    error.hidden = true;
    error.textContent = "";
  } catch (loadError) {
    console.error(loadError);
    error.textContent = "Schedule information is temporarily unavailable.";
    error.hidden = false;
  }
}

if (typeof document !== "undefined") {
  initialisePublicSchedule();
}
