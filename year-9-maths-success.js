(function () {
  "use strict";

  const SUCCESS_PATH = "/year-9-maths-request-received";
  const OPENAI_PIXEL_ID = "EfPv2PHXRnog2fzyoK8DHA";
  const OPENAI_SDK_URL = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
  const CAMPAIGN_MARKER_KEY = "jothi_year9_maths_pending_enquiry_v1";
  const CONSUMED_MARKER_KEY = "jothi_year9_maths_openai_lead_v1";
  const PENDING_EXPIRY_MS = 10 * 60 * 1000;
  let openAIScriptPromise = null;
  let leadAttemptInProgress = false;
  let consumedMarkerIdThisPage = null;

  function readJson(storage, key) {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_error) {
      return null;
    }
  }

  function getConfirmedCampaignMarker() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path !== SUCCESS_PATH) return null;

    const marker = readJson(window.sessionStorage, CAMPAIGN_MARKER_KEY);
    if (!marker || marker.version !== 1 || typeof marker.id !== "string" || typeof marker.createdAt !== "number") return null;
    if (marker.source !== "openai") return null;
    if (marker.oppref != null && (typeof marker.oppref !== "string" || !/^[A-Za-z0-9._~+/=-]{1,200}$/.test(marker.oppref))) return null;

    const age = Date.now() - marker.createdAt;
    if (age < 0 || age > PENDING_EXPIRY_MS) return null;

    const consumed = readJson(window.sessionStorage, CONSUMED_MARKER_KEY);
    return consumedMarkerIdThisPage === marker.id || consumed?.id === marker.id ? null : marker;
  }

  function hasMarketingConsent() {
    return window.jothiMarketingConsent?.hasConsent() === true;
  }

  function setSuccessUrl(oppref) {
    const search = oppref ? "?oppref=" + encodeURIComponent(oppref) : "";
    if (window.location.search === search && !window.location.hash) return true;
    try {
      window.history.replaceState(null, "", SUCCESS_PATH + search);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function createOpenAIQueue() {
    if (typeof window.oaiq === "function") return;
    const queue = function () {
      queue.q.push(arguments);
    };
    queue.q = [];
    window.oaiq = queue;
    window.oaiq("consent", false);
    window.oaiq("init", { pixelId: OPENAI_PIXEL_ID });
  }

  function loadOpenAIPixel() {
    if (!hasMarketingConsent()) return Promise.resolve(false);
    createOpenAIQueue();
    window.oaiq("consent", true);

    if (!openAIScriptPromise) {
      openAIScriptPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.async = true;
        script.src = OPENAI_SDK_URL;
        script.dataset.jothiOpenAIPixel = "true";
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", reject, { once: true });
        document.head.appendChild(script);
      });
    }

    return openAIScriptPromise.then(function () {
      return hasMarketingConsent() && typeof window.oaiq === "function";
    });
  }

  function sendOpenAILeadCreated(marker) {
    if (typeof window.oaiq !== "function") return false;
    window.oaiq("measure", "lead_created", { type: "customer_action" }, { event_id: marker.id });
    return true;
  }

  function markConsumed(marker) {
    consumedMarkerIdThisPage = marker.id;
    try {
      window.sessionStorage.setItem(CONSUMED_MARKER_KEY, JSON.stringify({ id: marker.id, consumedAt: Date.now() }));
      window.sessionStorage.removeItem(CAMPAIGN_MARKER_KEY);
    } catch (_error) {
      // The event itself must not depend on browser storage being writable.
    }
  }

  function trySendConfirmedLead() {
    if (leadAttemptInProgress) return;
    const marker = getConfirmedCampaignMarker();
    if (!marker || !hasMarketingConsent()) return;
    if (!setSuccessUrl(marker.oppref)) return;
    leadAttemptInProgress = true;

    loadOpenAIPixel()
      .then(function (ready) {
        if (!ready || !hasMarketingConsent() || getConfirmedCampaignMarker()?.id !== marker.id) return;
        if (sendOpenAILeadCreated(marker)) {
          markConsumed(marker);
          setSuccessUrl(null);
        }
      })
      .catch(function () {
        // Tracking failures must not affect the confirmation experience.
      })
      .finally(function () {
        leadAttemptInProgress = false;
      });
  }

  function onMarketingConsentChanged() {
    if (!hasMarketingConsent() && typeof window.oaiq === "function") {
      window.oaiq("consent", false);
    }
    trySendConfirmedLead();
  }

  trySendConfirmedLead();
  window.addEventListener("jothi:marketing-consent-changed", onMarketingConsentChanged);
})();
