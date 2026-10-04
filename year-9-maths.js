(function () {
  "use strict";

  const FORM_NAME = "BiginWebToRecordForm985999000000548437";
  const CAMPAIGN_MARKER_KEY = "jothi_year9_maths_pending_enquiry_v1";
  const SUCCESS_URL = "https://jothi.uk/year-9-maths-request-received";
  const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "oppref"];
  const form = document.forms[FORM_NAME];
  if (!form) return;

  const crmSource = document.getElementById("year9-crm-source");
  const crmNotes = document.getElementById("year9-crm-notes");
  const returnUrl = document.getElementById("year9-return-url");
  const mainConcern = document.getElementById("year9-main-concern");
  const parentMessage = document.getElementById("year9-parent-message");
  const parentMessageField = document.getElementById("year9-parent-message-field");
  const errorMessage = document.getElementById("year9-form-error");
  const submitButton = document.getElementById("formsubmit");

  function cleanValue(value, maxLength) {
    return String(value || "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function getAttributionLines() {
    const params = new URLSearchParams(window.location.search);
    return ATTRIBUTION_KEYS.reduce(function (lines, key) {
      const value = cleanValue(params.get(key), 200);
      if (value) lines.push(key + "=" + value);
      return lines;
    }, []);
  }

  function classifySource() {
    const source = new URLSearchParams(window.location.search).get("utm_source")?.trim().toLowerCase();
    return source === "meta" || source === "openai" ? source : "unknown";
  }

  function getSafeOppref() {
    const value = new URLSearchParams(window.location.search).get("oppref");
    return value && /^[A-Za-z0-9._~+/=-]{1,200}$/.test(value) ? value : "";
  }

  function buildCrmNotes(source) {
    const concern = cleanValue(mainConcern.value, 2000);
    const additionalDetail = cleanValue(parentMessage.value, 2000);
    const qualification = ["Main Maths concern: " + concern];
    if (concern === "Other" && additionalDetail) {
      qualification.push("Additional detail: " + additionalDetail);
    }
    const platform = source === "meta" ? "Meta" : source === "openai" ? "OpenAI Ads" : "";
    crmSource.value = source === "openai" ? "OpenAI Ads" : "";
    const attribution = (platform ? ["marketing_platform=" + platform] : []).concat(
      ["landing_page=/year-9-maths"], getAttributionLines()
    );
    const sections = [qualification.join("\n")];

    sections.push(["Campaign attribution"].concat(attribution).join("\n"));
    crmNotes.value = sections.join("\n\n");
  }

  function syncOtherDetail() {
    const isOther = mainConcern.value === "Other";
    parentMessageField.hidden = !isOther;
    parentMessageField.setAttribute("aria-hidden", String(!isOther));
    parentMessage.required = isOther;
    if (!isOther) parentMessage.value = "";
  }

  function createCampaignMarker(oppref, source) {
    const marker = {
      version: 1,
      id:
        typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      oppref: oppref || null,
      source,
    };
    try {
      window.sessionStorage.setItem(CAMPAIGN_MARKER_KEY, JSON.stringify(marker));
    } catch (_error) {
      // Measurement storage failure must never prevent a genuine enquiry.
    }
  }

  window.checkMandatory985999000000548437 = function () {
    errorMessage.hidden = true;
    if (!form.checkValidity()) {
      errorMessage.hidden = false;
      form.reportValidity();
      return false;
    }

    const oppref = getSafeOppref();
    const source = classifySource();
    if (returnUrl) {
      returnUrl.value = SUCCESS_URL + (oppref ? "?oppref=" + encodeURIComponent(oppref) : "");
    }
    buildCrmNotes(source);
    createCampaignMarker(oppref, source);
    submitButton.disabled = true;
    submitButton.textContent = "Sending enquiry...";
    return true;
  };

  form.addEventListener("input", function () {
    errorMessage.hidden = true;
  });

  mainConcern.addEventListener("change", syncOtherDetail);
  syncOtherDetail();
})();

(function () {
  "use strict";

  const carousel = document.querySelector("[data-year9-proof-carousel]");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll("[data-year9-proof-slide]"));
  const panels = Array.from(carousel.querySelectorAll("[data-year9-proof-panel]"));
  const steppers = Array.from(carousel.querySelectorAll("[data-year9-proof-step]"));
  let current = 0;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      const isActive = slideIndex === current;
      slide.classList.toggle("is-active", isActive);
      slide.hidden = !isActive;
    });
    panels.forEach(function (panel, panelIndex) {
      const isActive = panelIndex === current;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  steppers.forEach(function (button) {
    button.addEventListener("click", function () {
      showSlide(current + Number(button.dataset.year9ProofStep || 0));
    });
  });

  carousel.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(current - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(current + 1);
    }
  });

  showSlide(0);
})();

(function () {
  "use strict";

  const stickyCta = document.querySelector("[data-year9-sticky-cta]");
  const hero = document.querySelector(".year9-hero");
  const consultation = document.getElementById("year9-consultation");
  if (!stickyCta || !hero || !consultation) return;

  const mobileQuery = window.matchMedia("(max-width: 720px)");
  let ticking = false;

  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function isCookieUiOpen() {
    const banner = document.querySelector("[data-cookie-banner]");
    const dialog = document.querySelector("[data-cookie-dialog-backdrop]");
    return Boolean(
      document.body.classList.contains("cookie-dialog-open") ||
        (banner && !banner.hidden) ||
        (dialog && !dialog.hidden)
    );
  }

  function setStickyVisibility() {
    ticking = false;
    const pastHero = hero.getBoundingClientRect().bottom <= 0;
    const shouldShow =
      mobileQuery.matches && pastHero && !isInViewport(consultation) && !isCookieUiOpen();

    stickyCta.hidden = !shouldShow;
    document.body.classList.toggle("year9-sticky-cta-visible", shouldShow);
  }

  function requestStickyUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(setStickyVisibility);
  }

  window.addEventListener("scroll", requestStickyUpdate, { passive: true });
  window.addEventListener("resize", requestStickyUpdate);
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", requestStickyUpdate);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(requestStickyUpdate);
  }

  const observer = new MutationObserver(requestStickyUpdate);
  observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  requestStickyUpdate();
})();
