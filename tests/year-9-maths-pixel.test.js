import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const fullSiteScript = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const consentStart = fullSiteScript.search(/\(function \(\) \{\r?\n  "use strict";\r?\n\r?\n  const META_PIXEL_ID/);
assert.notEqual(consentStart, -1, "the real site consent module is available");
const consentScript = fullSiteScript.slice(consentStart);
const successScript = readFileSync(new URL("../year-9-maths-success.js", import.meta.url), "utf8");
const formScript = readFileSync(new URL("../year-9-maths.js", import.meta.url), "utf8");
const landingHtml = readFileSync(new URL("../year-9-maths.html", import.meta.url), "utf8");
const successHtml = readFileSync(new URL("../year-9-maths-request-received.html", import.meta.url), "utf8");
const CAMPAIGN_MARKER_KEY = "jothi_year9_maths_pending_enquiry_v1";
const CONSUMED_MARKER_KEY = "jothi_year9_maths_openai_lead_v1";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function createElement() {
  const listeners = new Map();
  return {
    hidden: false,
    dataset: {},
    addEventListener: (name, callback) => listeners.set(name, callback),
    trigger: (name) => listeners.get(name)?.(),
    focus: () => {},
  };
}

function createPage(path, { marketing = null, marker = null, search = "", localStorage, sessionStorage } = {}) {
  const local = localStorage || createStorage(marketing === null ? {} : {
    jothi_cookie_consent_v1: JSON.stringify({ version: 1, marketing, timestamp: new Date().toISOString() }),
  });
  const session = sessionStorage || createStorage(marker ? { [CAMPAIGN_MARKER_KEY]: JSON.stringify(marker) } : {});
  const scripts = [];
  const historyChanges = [];
  const controls = Object.fromEntries([
    "[data-cookie-banner]", ".cookie-settings-trigger", "[data-cookie-dialog-backdrop]",
    ".cookie-dialog", "[data-cookie-marketing]", "[data-cookie-accept]",
    "[data-cookie-reject]", "[data-cookie-save]", "[data-cookie-dialog-close]",
  ].map((selector) => [selector, createElement()]));
  const container = {
    innerHTML: "",
    querySelector: (selector) => controls[selector],
    querySelectorAll: () => [],
  };
  const windowListeners = new Map();
  const window = {
    location: { pathname: path, search, hash: "" },
    localStorage: local,
    sessionStorage: session,
    history: { replaceState: (_state, _title, url) => {
      historyChanges.push(url);
      const updated = new URL(url, "https://jothi.uk");
      window.location.pathname = updated.pathname;
      window.location.search = updated.search;
      window.location.hash = updated.hash;
    } },
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    dispatchEvent: (event) => windowListeners.get(event.type)?.(event),
  };
  const document = {
    readyState: "complete",
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    head: { appendChild: (script) => scripts.push(script) },
    createElement: (tag) => tag === "script" ? createElement() : container,
    addEventListener: () => {},
    activeElement: null,
  };
  const context = vm.createContext({ window, document, Promise, CustomEvent: class {
    constructor(type) { this.type = type; }
  } });

  function runScripts({ success = false } = {}) {
    vm.runInContext(consentScript, context);
    if (success) vm.runInContext(successScript, context);
  }

  return { window, scripts, controls, local, session, historyChanges, context, runScripts };
}

function pixelCalls(page, command) {
  return Array.from(page.window.oaiq?.q || [])
    .filter((args) => args[0] === command)
    .map((args) => Array.from(args));
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("the Year 9 form page never loads OpenAI, including after consent; Meta still loads", async () => {
  const marker = { version: 1, id: "test-landing", createdAt: Date.now(), oppref: "click_123" };
  const page = createPage("/year-9-maths", { marketing: true, marker, search: "?oppref=click_123" });
  page.runScripts();
  assert.equal(page.window.oaiq, undefined);
  assert.equal(page.scripts.filter((script) => script.dataset.jothiOpenAIPixel).length, 0);
  const meta = page.scripts.find((script) => script.dataset.jothiMetaPixel);
  assert.equal(meta?.src, "https://connect.facebook.net/en_US/fbevents.js");
  meta.trigger("load");
  await settle();
  assert.deepEqual(Array.from(page.window.fbq.queue, (call) => call[0]), ["init", "track"]);
  page.controls["[data-cookie-reject]"].trigger("click");
  page.controls["[data-cookie-accept]"].trigger("click");
  await settle();
  assert.equal(page.window.oaiq, undefined);
  assert.equal(page.scripts.filter((script) => script.dataset.jothiOpenAIPixel).length, 0);
  assert.doesNotMatch(consentScript, /bzrcdn\.openai\.com|\boaiq\s*\(/);
  assert.doesNotMatch(landingHtml, /year-9-maths-success\.js|bzrcdn\.openai\.com|\boaiq\s*\(/);
});

test("the existing Meta success flow still sends its Lead event", async () => {
  const session = createStorage({
    jothi_pending_enquiry_v1: JSON.stringify({ version: 1, id: "meta-test", createdAt: Date.now() }),
  });
  const page = createPage("/year-9-maths-request-received", { marketing: true, sessionStorage: session });
  page.runScripts({ success: true });
  page.scripts.find((script) => script.dataset.jothiMetaPixel).trigger("load");
  await settle();
  assert.deepEqual(Array.from(page.window.fbq.queue, (call) => [call[0], call[1]]), [
    ["init", "1497091182452721"], ["track", "PageView"], ["track", "Lead"],
  ]);
  assert.equal(page.window.oaiq, undefined);
});

test("direct success visits, expired markers, and unrelated routes cannot initialise OpenAI", async () => {
  const cases = [
    ["/year-9-maths-request-received", null],
    ["/year-9-maths-request-received", { version: 1, id: "expired", createdAt: Date.now() - 11 * 60 * 1000 }],
    ["/year-9-maths-request-received", { version: 1, id: "invalid", createdAt: Date.now(), oppref: "bad&value" }],
    ["/consultation-request-received", { version: 1, id: "unrelated", createdAt: Date.now() }],
  ];
  for (const [path, marker] of cases) {
    const page = createPage(path, { marketing: true, marker, search: "?oppref=untrusted" });
    page.runScripts({ success: true });
    await settle();
    assert.equal(page.window.oaiq, undefined);
    assert.equal(page.scripts.filter((script) => script.dataset.jothiOpenAIPixel).length, 0);
    assert.equal(page.window.location.search, "");
  }
});

test("a fresh marker without consent cannot initialise the SDK or send a conversion", async () => {
  const page = createPage("/year-9-maths-request-received", {
    marker: { version: 1, id: "no-consent", createdAt: Date.now(), oppref: "click_123" },
    search: "?oppref=click_123",
  });
  page.runScripts({ success: true });
  await settle();
  assert.equal(page.window.oaiq, undefined);
  assert.equal(page.scripts.filter((script) => script.dataset.jothiOpenAIPixel).length, 0);
  assert.ok(page.session.getItem(CAMPAIGN_MARKER_KEY));
});

test("consent and a fresh marker expose oppref to the SDK, then queue one minimal event and clean the URL", async () => {
  const local = createStorage();
  const session = createStorage({ [CAMPAIGN_MARKER_KEY]: JSON.stringify({
    version: 1, id: "test-year9-event-id", createdAt: Date.now(), oppref: "click_123",
  }) });
  const page = createPage("/year-9-maths-request-received", {
    localStorage: local, sessionStorage: session, search: "?oppref=click_123",
  });
  page.runScripts({ success: true });
  page.controls["[data-cookie-accept]"].trigger("click");
  const sdk = page.scripts.find((script) => script.dataset.jothiOpenAIPixel);
  assert.equal(sdk?.src, "https://bzrcdn.openai.com/sdk/oaiq.min.js");
  assert.equal(page.window.location.search, "?oppref=click_123");
  assert.deepEqual(pixelCalls(page, "consent").map((call) => call[1]), [false, true]);
  assert.equal(pixelCalls(page, "init")[0][1].pixelId, "EfPv2PHXRnog2fzyoK8DHA");
  assert.equal(pixelCalls(page, "measure").length, 0);
  sdk.trigger("load");
  await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(pixelCalls(page, "measure"))), [[
    "measure", "lead_created", { type: "customer_action" }, { event_id: "test-year9-event-id" },
  ]]);
  assert.equal(page.window.location.search, "");
  assert.equal(page.historyChanges.at(-1), "/year-9-maths-request-received");
  assert.equal(session.getItem(CAMPAIGN_MARKER_KEY), null);
  assert.equal(JSON.parse(session.getItem(CONSUMED_MARKER_KEY)).id, "test-year9-event-id");
  page.window.dispatchEvent({ type: "jothi:marketing-consent-changed" });
  await settle();
  assert.equal(pixelCalls(page, "measure").length, 1);

  const refresh = createPage("/year-9-maths-request-received", { localStorage: local, sessionStorage: session });
  refresh.runScripts({ success: true });
  await settle();
  assert.equal(refresh.window.oaiq, undefined);
  assert.equal(refresh.scripts.filter((script) => script.dataset.jothiOpenAIPixel).length, 0);
});

test("the campaign marker restores only approved oppref if Bigin omits or adds query data", async () => {
  for (const search of ["", "?oppref=untrusted&student=Ada"]) {
    const page = createPage("/year-9-maths-request-received", {
      marketing: true,
      marker: { version: 1, id: "fallback", createdAt: Date.now(), oppref: "click+123/=" },
      search,
    });
    page.runScripts({ success: true });
    assert.equal(page.window.location.search, "?oppref=click%2B123%2F%3D");
    assert.equal(page.historyChanges[0], "/year-9-maths-request-received?oppref=click%2B123%2F%3D");
    assert.equal(page.window.location.search.includes("student"), false);
    page.scripts.find((script) => script.dataset.jothiOpenAIPixel).trigger("load");
    await settle();
    assert.equal(pixelCalls(page, "measure").length, 1);
    assert.equal(page.window.location.search, "");
  }
});

test("revoking consent during SDK loading prevents measurement and propagates denial", async () => {
  const page = createPage("/year-9-maths-request-received", {
    marker: { version: 1, id: "revoked", createdAt: Date.now(), oppref: "click_123" },
  });
  page.runScripts({ success: true });
  page.controls["[data-cookie-accept]"].trigger("click");
  const sdk = page.scripts.find((script) => script.dataset.jothiOpenAIPixel);
  page.controls["[data-cookie-reject]"].trigger("click");
  sdk.trigger("load");
  await settle();
  assert.equal(pixelCalls(page, "consent").at(-1)[1], false);
  assert.equal(pixelCalls(page, "measure").length, 0);
  assert.ok(page.session.getItem(CAMPAIGN_MARKER_KEY));
});

test("the OpenAI conversion surface contains no enquiry form or explicit customer data", () => {
  assert.doesNotMatch(successHtml, /<form\b/i);
  assert.doesNotMatch(successScript, /user\s*:/);
  assert.doesNotMatch(successScript, /debug\s*:\s*true/);
  assert.match(formScript, /const ATTRIBUTION_KEYS = \["utm_source", "utm_medium", "utm_campaign", "oppref"\]/);
  assert.match(formScript, /const value = cleanValue\(params\.get\(key\), 200\)/);
});
