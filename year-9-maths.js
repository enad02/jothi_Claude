(function () {
  "use strict";

  const FORM_NAME = "BiginWebToRecordForm985999000000548437";
  const CAMPAIGN_MARKER_KEY = "jothi_year9_maths_pending_enquiry_v1";
  const SUCCESS_URL = "https://jothi.uk/year-9-maths-request-received";
  const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "oppref"];
  const CAMPAIGN_ATTRIBUTION_LINES = [
    "marketing_platform=OpenAI Ads",
    "campaign_name=Year 9 Maths Admissions - 2026 Test 1",
    "ad_group=Year 9 Maths - AQA Edexcel OCR",
    "ad_name=Year 9 Maths Tuition - Parent Consultation",
    "landing_page=/year-9-maths",
  ];
  const form = document.forms[FORM_NAME];
  if (!form) return;

  const crmNotes = document.getElementById("year9-crm-notes");
  const returnUrl = document.getElementById("year9-return-url");
  const examBoard = document.getElementById("year9-exam-board");
  const availability = document.getElementById("year9-availability");
  const mainConcern = document.getElementById("year9-main-concern");
  const parentMessage = document.getElementById("year9-parent-message");
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

  function getSafeOppref() {
    const value = new URLSearchParams(window.location.search).get("oppref");
    return value && /^[A-Za-z0-9._~+/=-]{1,200}$/.test(value) ? value : "";
  }

  function buildCrmNotes() {
    const qualification = [
      "Campaign qualification data",
      "Exam board: " + cleanValue(examBoard.value, 50),
      "Availability: " + cleanValue(availability.value, 80),
      "Main Maths concern: " + cleanValue(mainConcern.value, 2000),
    ];
    const message = cleanValue(parentMessage.value, 2000);
    const attribution = CAMPAIGN_ATTRIBUTION_LINES.concat(getAttributionLines());
    const sections = [qualification.join("\n")];

    sections.push("Parent message\n" + (message || "No additional message provided."));
    sections.push(["Campaign attribution"].concat(attribution).join("\n"));
    crmNotes.value = sections.join("\n\n");
  }

  function createCampaignMarker(oppref) {
    const marker = {
      version: 1,
      id:
        typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      oppref: oppref || null,
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
    if (returnUrl) {
      returnUrl.value = SUCCESS_URL + (oppref ? "?oppref=" + encodeURIComponent(oppref) : "");
    }
    buildCrmNotes();
    createCampaignMarker(oppref);
    submitButton.disabled = true;
    submitButton.textContent = "Sending enquiry...";
    return true;
  };

  form.addEventListener("input", function () {
    errorMessage.hidden = true;
  });
})();

(function () {
  "use strict";

  const carousel = document.querySelector("[data-year9-proof-carousel]");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll("[data-year9-proof-slide]"));
  const panels = Array.from(carousel.querySelectorAll("[data-year9-proof-panel]"));
  const steppers = Array.from(carousel.querySelectorAll("[data-year9-proof-step]"));
  const status = carousel.querySelector("[data-year9-proof-status]");
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
    if (status) status.textContent = String(current + 1) + " of " + String(slides.length);
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
