import { readFile } from "node:fs/promises";
import { applyEventOverrides, generateSchedule } from "../../a-level-scheduler-engine.js";
import { eventOverridesFromApiState, programmeFromApiState } from "../../a-level-scheduler-state.js";

const baseUrl = process.argv[2] || "http://127.0.0.1:8788";
const endpoint = process.argv[3] || "/api/a-level-scheduler/2026-27/state";
const curriculum = JSON.parse(await readFile(new URL("../../data/a-level-maths/year12-curriculum.json", import.meta.url), "utf8"));
const baseline = JSON.parse(await readFile(new URL("../../data/a-level-maths/2026-27.json", import.meta.url), "utf8"));
const response = await fetch(`${baseUrl}${endpoint}`);

if (!response.ok) {
  throw new Error(`Schedule state returned HTTP ${response.status}.`);
}

const state = await response.json();
const programme = programmeFromApiState(state, baseline);
const result = applyEventOverrides(generateSchedule(curriculum, programme), curriculum, programme, eventOverridesFromApiState(state));

for (const batch of result.batches) {
  const first = batch.cycles[0].teaching;
  console.log(`${batch.batch_id} first=${first.date} ${first.start_time}-${first.end_time} forecast=${batch.progress.forecast_completion_date} total=${batch.progress.total_supervised_hours}`);
}
