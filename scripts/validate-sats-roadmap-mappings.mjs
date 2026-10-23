import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roadmapFile = path.join(repoRoot, "sats-maths-learning-roadmap", "sats-maths-learning-roadmap.js");
const source = fs.readFileSync(roadmapFile, "utf8");
const instrumented = source.replace(/\}\(\)\);\s*$/, "globalThis.__roadmapStrands=strands;}());");
if (instrumented === source) throw new Error("Could not instrument roadmap dataset.");

const app = { innerHTML: "", querySelector: () => ({ addEventListener() {} }), querySelectorAll: () => [] };
const document = { getElementById: () => app, querySelector: () => null, addEventListener() {} };
const context = { document, location: { hash: "" }, setTimeout() { return 0; } };
vm.runInNewContext(instrumented, context, { filename: roadmapFile });
const strands = context.__roadmapStrands;

const expected = [
  ["Numbers and place value", 7],
  ["Calculations and number operations", 7],
  ["Fractions", 8],
  ["Decimals and percentages", 9],
  ["Ratio, proportion and algebra", 8],
  ["Measurement and money", 5],
  ["Shapes, area, volume and angles", 9],
  ["Coordinates, transformations and statistics", 7],
];
const failures = [];
const seenIds = new Set();
const seenImages = new Set();
if (strands.length !== expected.length) failures.push(`Expected ${expected.length} strands; found ${strands.length}.`);

for (const [strandIndex, strand] of strands.entries()) {
  const [expectedName, expectedCount] = expected[strandIndex] || [];
  if (strand.name !== expectedName) failures.push(`Strand ${strandIndex + 1} name: expected ${expectedName}; found ${strand.name}.`);
  if (strand.topics.length !== expectedCount) failures.push(`Strand ${strandIndex + 1} topic count: expected ${expectedCount}; found ${strand.topics.length}.`);
  for (const topic of strand.topics) {
    if (seenIds.has(topic.id)) failures.push(`Duplicate topic ID: ${topic.id}.`);
    seenIds.add(topic.id);
    let status = "unmapped";
    let filename = "—";
    if (topic.illustration) {
      filename = path.basename(topic.illustration);
      const imageKey = topic.illustration;
      if (seenImages.has(imageKey)) failures.push(`Duplicate image mapping: ${imageKey}.`);
      seenImages.add(imageKey);
      const strandReference = topic.illustration.match(/img-src\/strand-(\d{2})-/);
      if (strandReference && Number(strandReference[1]) !== strandIndex + 1) failures.push(`Wrong-strand image reference for ${topic.id}: ${topic.illustration}.`);
      const localPath = path.join(repoRoot, topic.illustration.replace(/^\//, ""));
      if (!fs.existsSync(localPath)) {
        failures.push(`Missing mapped image for ${topic.id}: ${topic.illustration}.`);
        status = "MISSING";
      } else status = "mapped";
    }
    console.log(`${strandIndex + 1} | ${topic.id} | ${topic.title} | ${filename} | ${status}`);
  }
}
if (seenIds.size !== 60) failures.push(`Expected 60 unique topic IDs; found ${seenIds.size}.`);
console.log(`\nSummary: ${strands.length} strands, ${seenIds.size} unique topics, ${seenImages.size} mapped images.`);
if (failures.length) {
  console.error("\nFAILURES:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else console.log("Mapping integrity: PASS");
