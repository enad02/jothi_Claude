import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const FORM_NAME = "BiginWebToRecordForm985999000000548437";

test("Year 9 form prepares the approved Bigin payload before submission", () => {
  const html = readFileSync(new URL("../year-9-maths.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../year-9-maths.js", import.meta.url), "utf8");
  const descriptionMarkup = html.match(/<textarea[^>]*id="year9-crm-notes"[^>]*>/)?.[0];
  const returnUrlMarkup = html.match(/<input[^>]*id="year9-return-url"[^>]*>/)?.[0];

  assert.ok(descriptionMarkup, "Pipeline Description control is present");
  assert.match(descriptionMarkup, /name="Description"/);
  assert.doesNotMatch(descriptionMarkup, /\bdisabled\b/);
  assert.match(html, /name="POTENTIALCF12" value="OpenAI Ads"/);
  assert.doesNotMatch(html, /name="Contacts\.Description"/);
  assert.match(returnUrlMarkup, /name="returnURL"/);

  const potentialName = { name: "Potential Name", value: "YearNineRetest", disabled: false };
  const yearGroup = { name: "POTENTIALCF4", value: "Year 9", disabled: false };
  const hearAbout = { name: "POTENTIALCF12", value: "OpenAI Ads", disabled: false };
  const description = { name: "Description", value: "", disabled: false };
  const returnUrl = { name: "returnURL", value: "https://jothi.uk/year-9-maths-request-received", disabled: false };
  const elements = {
    "year9-crm-notes": description,
    "year9-return-url": returnUrl,
    "year9-exam-board": { value: "Not sure" },
    "year9-availability": { value: "Either" },
    "year9-main-concern": { value: "Controlled CRM mapping test" },
    "year9-parent-message": { value: "TEST LEAD ONLY" },
    "year9-form-error": { hidden: false },
    formsubmit: { disabled: false, textContent: "Request a consultation" },
  };
  const form = {
    elements: [potentialName, yearGroup, hearAbout, description, returnUrl],
    checkValidity: () => true,
    reportValidity: () => {},
    addEventListener: () => {},
  };
  const storage = new Map();
  const window = {
    crypto: { randomUUID: () => "local-payload-test" },
    location: {
      search: "?utm_source=openai&utm_medium=paid&utm_campaign=year9_maths_chatgpt_2026&oppref=controlled_retest_20260930&ignored=not_included",
    },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
  const document = {
    forms: { [FORM_NAME]: form },
    getElementById: (id) => elements[id] ?? null,
    querySelector: () => null,
  };

  vm.runInNewContext(script, { document, URLSearchParams, window });
  assert.equal(window.checkMandatory985999000000548437(), true);

  const outgoingPayload = new URLSearchParams(
    form.elements
      .filter((field) => field.name && !field.disabled)
      .map((field) => [field.name, field.value]),
  );
  const expectedDescription = [
    "Campaign qualification data",
    "Exam board: Not sure",
    "Availability: Either",
    "Main Maths concern: Controlled CRM mapping test",
    "",
    "Parent message",
    "TEST LEAD ONLY",
    "",
    "Campaign attribution",
    "marketing_platform=OpenAI Ads",
    "campaign_name=Year 9 Maths Admissions - 2026 Test 1",
    "ad_group=Year 9 Maths - AQA Edexcel OCR",
    "ad_name=Year 9 Maths Tuition - Parent Consultation",
    "landing_page=/year-9-maths",
    "utm_source=openai",
    "utm_medium=paid",
    "utm_campaign=year9_maths_chatgpt_2026",
    "oppref=controlled_retest_20260930",
  ].join("\n");

  assert.equal(outgoingPayload.get("Potential Name"), "YearNineRetest");
  assert.equal(outgoingPayload.get("POTENTIALCF4"), "Year 9");
  assert.equal(outgoingPayload.get("POTENTIALCF12"), "OpenAI Ads");
  assert.equal(outgoingPayload.get("Description"), expectedDescription);
  assert.equal(outgoingPayload.get("returnURL"), "https://jothi.uk/year-9-maths-request-received?oppref=controlled_retest_20260930");
  assert.equal(outgoingPayload.has("Contacts.Description"), false);
  assert.equal(outgoingPayload.get("Description").includes("ignored"), false);
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).oppref, "controlled_retest_20260930");

  window.location.search = "?oppref=click%2B123%2F%3D";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(returnUrl.value, "https://jothi.uk/year-9-maths-request-received?oppref=click%2B123%2F%3D");
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).oppref, "click+123/=");

  window.location.search = "?oppref=bad%26extra";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(returnUrl.value, "https://jothi.uk/year-9-maths-request-received");
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).oppref, null);
});
