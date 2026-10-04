import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const FORM_NAME = "BiginWebToRecordForm985999000000548437";

test("Year 9 conditional detail is hidden by default in markup and CSS", () => {
  const html = readFileSync(new URL("../year-9-maths.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../year-9-maths.css", import.meta.url), "utf8");

  assert.match(html, /<label[^>]*id="year9-parent-message-field"[^>]*\shidden(?:\s|>)/);
  assert.match(css, /\.year9-form\s+\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/);
});

test("Year 9 form prepares the approved Bigin payload before submission", () => {
  const html = readFileSync(new URL("../year-9-maths.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../year-9-maths.js", import.meta.url), "utf8");
  const descriptionMarkup = html.match(/<textarea[^>]*id="year9-crm-notes"[^>]*>/)?.[0];
  const returnUrlMarkup = html.match(/<input[^>]*id="year9-return-url"[^>]*>/)?.[0];

  assert.ok(descriptionMarkup, "Pipeline Description control is present");
  assert.match(descriptionMarkup, /name="Description"/);
  assert.doesNotMatch(descriptionMarkup, /\bdisabled\b/);
  assert.match(html, /name="POTENTIALCF12" id="year9-crm-source" value=""/);
  assert.doesNotMatch(html, /name="Contacts\.Description"/);
  assert.match(returnUrlMarkup, /name="returnURL"/);
  assert.doesNotMatch(html, /id="year9-exam-board"/);
  assert.doesNotMatch(html, /id="year9-availability"/);
  assert.doesNotMatch(html, /Optional short message/);
  assert.match(html, /What would you like help with in Maths\?/);
  assert.match(html, /value="Other">Other/);
  assert.match(html, /id="year9-privacy-consent" required/);

  const potentialName = { name: "Potential Name", value: "YearNineRetest", disabled: false };
  const yearGroup = { name: "POTENTIALCF4", value: "Year 9", disabled: false };
  const hearAbout = { name: "POTENTIALCF12", value: "", disabled: false };
  const description = { name: "Description", value: "", disabled: false };
  const returnUrl = { name: "returnURL", value: "https://jothi.uk/year-9-maths-request-received", disabled: false };
  const listeners = {};
  const mainConcern = {
    value: "Confidence with Maths",
    addEventListener: (type, handler) => { listeners[type] = handler; },
  };
  const parentMessage = { value: "", required: false };
  const parentMessageField = {
    hidden: true,
    setAttribute: (name, value) => { parentMessageField[name] = value; },
  };
  const elements = {
    "year9-crm-source": hearAbout,
    "year9-crm-notes": description,
    "year9-return-url": returnUrl,
    "year9-main-concern": mainConcern,
    "year9-parent-message": parentMessage,
    "year9-parent-message-field": parentMessageField,
    "year9-form-error": { hidden: false },
    formsubmit: { disabled: false, textContent: "Request a consultation" },
  };
  const form = {
    elements: [potentialName, yearGroup, hearAbout, description, returnUrl],
    checkValidity: () => mainConcern.value !== "" && (!parentMessage.required || parentMessage.value.trim() !== ""),
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
  assert.equal(parentMessageField.hidden, true);
  assert.equal(hearAbout.value, "");
  assert.equal(parentMessage.required, false);
  assert.equal(typeof listeners.change, "function");
  assert.equal(window.checkMandatory985999000000548437(), true);

  const outgoingPayload = new URLSearchParams(
    form.elements
      .filter((field) => field.name && !field.disabled)
      .map((field) => [field.name, field.value]),
  );
  const expectedDescription = [
    "Main Maths concern: Confidence with Maths",
    "",
    "Campaign attribution",
    "marketing_platform=OpenAI Ads",
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
  assert.doesNotMatch(outgoingPayload.get("Description"), /Additional detail/);
  assert.equal(outgoingPayload.get("returnURL"), "https://jothi.uk/year-9-maths-request-received?oppref=controlled_retest_20260930");
  assert.equal(outgoingPayload.has("Contacts.Description"), false);
  assert.equal(outgoingPayload.get("Description").includes("ignored"), false);
  const openAIMarker = JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1"));
  assert.equal(openAIMarker.version, 1);
  assert.equal(openAIMarker.id, "local-payload-test");
  assert.equal(typeof openAIMarker.createdAt, "number");
  assert.equal(openAIMarker.oppref, "controlled_retest_20260930");
  assert.equal(openAIMarker.source, "openai");

  window.location.search = "?utm_source=%20MeTa%20&utm_medium=paid_social&utm_campaign=year9_meta_2_0&oppref=meta_click";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(hearAbout.value, "");
  assert.match(description.value, /marketing_platform=Meta/);
  assert.match(description.value, /utm_source=MeTa\nutm_medium=paid_social\nutm_campaign=year9_meta_2_0\noppref=meta_click/);
  assert.doesNotMatch(description.value, /OpenAI Ads|campaign_name=|ad_group=|ad_name=/);
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).source, "meta");
  assert.equal(returnUrl.value, "https://jothi.uk/year-9-maths-request-received?oppref=meta_click");

  window.location.search = "?utm_source=newsletter&utm_medium=email&utm_campaign=year9_update";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(hearAbout.value, "");
  assert.match(description.value, /utm_source=newsletter\nutm_medium=email\nutm_campaign=year9_update/);
  assert.doesNotMatch(description.value, /marketing_platform=|OpenAI Ads|campaign_name=|ad_group=|ad_name=/);
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).source, "unknown");

  window.location.search = "";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(hearAbout.value, "");
  assert.doesNotMatch(description.value, /marketing_platform=|utm_source=/);
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).source, "unknown");

  window.location.search = "?oppref=click%2B123%2F%3D";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(returnUrl.value, "https://jothi.uk/year-9-maths-request-received?oppref=click%2B123%2F%3D");
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).oppref, "click+123/=");
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).source, "unknown");

  mainConcern.value = "Other";
  listeners.change();
  assert.equal(parentMessageField.hidden, false);
  assert.equal(parentMessageField["aria-hidden"], "false");
  assert.equal(parentMessage.required, true);
  parentMessage.value = "Needs help with problem-solving questions.";
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.match(description.value, /Main Maths concern: Other\nAdditional detail: Needs help with problem-solving questions\./);

  mainConcern.value = "Confidence with Maths";
  listeners.change();
  assert.equal(parentMessageField.hidden, true);
  assert.equal(parentMessageField["aria-hidden"], "true");
  assert.equal(parentMessage.required, false);
  assert.equal(parentMessage.value, "");
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.doesNotMatch(description.value, /Additional detail/);

  mainConcern.value = "";
  listeners.change();
  assert.equal(window.checkMandatory985999000000548437(), false);

  window.location.search = "?oppref=bad%26extra";
  mainConcern.value = "Confidence with Maths";
  listeners.change();
  assert.equal(window.checkMandatory985999000000548437(), true);
  assert.equal(returnUrl.value, "https://jothi.uk/year-9-maths-request-received");
  assert.equal(JSON.parse(storage.get("jothi_year9_maths_pending_enquiry_v1")).oppref, null);
});
