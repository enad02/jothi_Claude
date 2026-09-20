const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  const closeNav = () => {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 860 && siteNav.classList.contains("is-open")) {
        closeNav();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeNav();
    }
  });
}

(function () {
  const track = document.getElementById("heroCarouselTrack");
  if (!track) return;
  const dots = Array.from(document.querySelectorAll(".hero-carousel-dot"));
  let current = 0;
  let timer;

  function goTo(idx) {
    current = idx;
    track.style.transform = "translateX(-" + idx * 100 + "%)";
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === idx);
      d.setAttribute("aria-selected", i === idx ? "true" : "false");
    });
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
      goTo((current + 1) % dots.length);
    }, 4000);
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(Number(dot.dataset.idx));
      startTimer();
    });
  });

  startTimer();
})();

(function () {
  const carousels = Array.from(document.querySelectorAll("[data-hero-proof-carousel]"));
  if (!carousels.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intervalMs = 5500;

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(src);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function createSlide(src, index) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");

    figure.className = "hero-proof-slide";
    image.className = "hero-proof-image";
    image.src = src;
    image.alt = "Additional annotated live lesson work example " + index;
    image.loading = "lazy";
    image.decoding = "async";

    figure.appendChild(image);
    return figure;
  }

  function initCarousel(carousel) {
    const dots = carousel.parentElement?.querySelector(".hero-proof-dots");
    const slides = Array.from(carousel.querySelectorAll(".hero-proof-slide"));
    let current = 0;
    let timer;

    carousel.dataset.slideCount = String(slides.length);

    if (slides.length <= 1) {
      slides[0]?.classList.add("is-active");
      if (dots) dots.hidden = true;
      return;
    }

    if (dots) {
      dots.hidden = false;
      dots.innerHTML = "";
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-proof-dot";
        dot.setAttribute("aria-label", "Show live lesson proof " + (index + 1));
        dot.addEventListener("click", () => {
          goTo(index);
          restart();
        });
        dots.appendChild(dot);
      });
    }

    const dotButtons = dots ? Array.from(dots.querySelectorAll(".hero-proof-dot")) : [];

    function goTo(index) {
      current = index;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dotButtons.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === current);
        dot.setAttribute("aria-current", dotIndex === current ? "true" : "false");
      });
    }

    function start() {
      if (prefersReducedMotion) return;
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        goTo((current + 1) % slides.length);
      }, intervalMs);
    }

    function stop() {
      window.clearInterval(timer);
    }

    function restart() {
      stop();
      start();
    }

    goTo(0);
    start();

    const pauseTarget = carousel.closest(".hero-proof-stage") || carousel;

    pauseTarget.addEventListener("mouseenter", stop);
    pauseTarget.addEventListener("mouseleave", start);
    pauseTarget.addEventListener("focusin", stop);
    pauseTarget.addEventListener("focusout", start);
  }

  carousels.forEach((carousel) => {
    const extraSrcs = (carousel.dataset.extraSrcs || "").split("|").filter(Boolean);

    Promise.all(extraSrcs.map(loadImage)).then((loadedSrcs) => {
      loadedSrcs.filter(Boolean).forEach((src, index) => {
        carousel.appendChild(createSlide(src, index + 2));
      });

      initCarousel(carousel);
    });
  });
})();

(function () {
  function initScrollCarousel(trackId, prevId, nextId, cardSelector, fallbackFraction, fallbackGap) {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    if (!track || !prevBtn || !nextBtn) return;

    function cardWidth() {
      const card = track.querySelector(cardSelector);
      return card ? card.offsetWidth + fallbackGap : track.clientWidth * fallbackFraction;
    }

    prevBtn.addEventListener("click", function () {
      track.scrollBy({ left: -cardWidth(), behavior: "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      track.scrollBy({ left: cardWidth(), behavior: "smooth" });
    });
  }

  initScrollCarousel("tutorTrack", "tutorPrev", "tutorNext", ".tutor-strip-card", 0.8, 18);
  initScrollCarousel("proofTrack", "proofPrev", "proofNext", ".results-proof-card", 0.9, 20);
  initScrollCarousel("messageTrack", "messagePrev", "messageNext", ".results-message-card", 0.9, 20);
  initScrollCarousel("reviewTrack", "reviewPrev", "reviewNext", ".results-review-card", 0.9, 20);
  initScrollCarousel("certTrack", "certPrev", "certNext", ".results-cert-card", 0.9, 20);
})();

(function () {
  var track = document.getElementById("tutorTrack");
  var dotsContainer = document.getElementById("tutorDots");
  if (!track || !dotsContainer) return;

  var cards = track.querySelectorAll(".tutor-strip-card");
  var totalCards = cards.length;
  if (!totalCards) return;

  var DOT_COUNT = 6;

  function buildDots() {
    dotsContainer.innerHTML = "";
    for (var i = 0; i < DOT_COUNT; i++) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "tutor-strip-dot";
      dot.setAttribute("aria-label", "Teaching team page " + (i + 1));
      dot.addEventListener("click", (function(idx) {
        return function() {
          var maxScroll = track.scrollWidth - track.clientWidth;
          var targetScroll = maxScroll > 0 ? Math.round((idx / (DOT_COUNT - 1)) * maxScroll) : 0;
          track.scrollTo({ left: targetScroll, behavior: "smooth" });
        };
      })(i));
      dotsContainer.appendChild(dot);
    }
    syncDots();
  }

  function syncDots() {
    var dots = dotsContainer.querySelectorAll(".tutor-strip-dot");
    if (!dots.length) return;
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) {
      dots.forEach(function(d, i) {
        d.classList.toggle("is-active", i === 0);
        d.setAttribute("aria-current", i === 0 ? "true" : "false");
      });
      return;
    }
    var ratio = track.scrollLeft / maxScroll;
    var activeDot = Math.min(Math.round(ratio * (DOT_COUNT - 1)), DOT_COUNT - 1);
    dots.forEach(function(d, i) {
      d.classList.toggle("is-active", i === activeDot);
      d.setAttribute("aria-current", i === activeDot ? "true" : "false");
    });
  }

  buildDots();
  track.addEventListener("scroll", syncDots, { passive: true });
})();

(function () {
  var stage = document.getElementById("parentStoriesStage");
  if (!stage) return;

  var cards = stage.querySelectorAll(".parent-stories-track > .parent-stories-card");
  var dots = stage.querySelectorAll(".parent-stories-dot");
  var prev = stage.querySelector(".parent-stories-prev");
  var next = stage.querySelector(".parent-stories-next");
  if (!cards.length || !dots.length) return;

  var currentIndex = 0;

  function goTo(index) {
    if (index === currentIndex) return;
    cards[currentIndex].classList.remove("is-active");
    dots[currentIndex].classList.remove("is-active");
    dots[currentIndex].setAttribute("aria-selected", "false");

    currentIndex = (index + cards.length) % cards.length;

    cards[currentIndex].classList.add("is-active");
    dots[currentIndex].classList.add("is-active");
    dots[currentIndex].setAttribute("aria-selected", "true");
  }

  function activateTestimonialFromHash() {
    if (!window.location.hash || !window.location.hash.startsWith("#testimonial-")) return;

    var card = document.querySelector(window.location.hash);
    if (!card || !card.classList.contains("parent-stories-card") || !stage.contains(card)) return;

    var index = Number(card.getAttribute("data-ps-id"));
    if (!Number.isInteger(index) || index < 0 || index >= cards.length) return;

    cards.forEach(function (item, itemIndex) {
      item.classList.toggle("is-active", itemIndex === index);
    });

    dots.forEach(function (dot, dotIndex) {
      var isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    currentIndex = index;

    window.setTimeout(function () {
      card.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);
  }

  if (prev) {
    prev.addEventListener("click", function () {
      goTo(currentIndex - 1);
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      goTo(currentIndex + 1);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      var idx = Array.prototype.indexOf.call(dots, dot);
      goTo(idx);
    });
  });

  var viewport = stage.querySelector(".parent-stories-viewport");
  if (viewport) {
    var touchStartX = 0;
    var touchStartY = 0;

    viewport.addEventListener("touchstart", function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    viewport.addEventListener("touchend", function (e) {
      var deltaX = e.changedTouches[0].clientX - touchStartX;
      var deltaY = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          goTo(currentIndex + 1);
        } else {
          goTo(currentIndex - 1);
        }
      }
    });
  }

  activateTestimonialFromHash();
  window.addEventListener("load", activateTestimonialFromHash);
  window.addEventListener("hashchange", activateTestimonialFromHash);
})();

(function () {
  "use strict";

  const META_PIXEL_ID = "1497091182452721";
  const CONSENT_VERSION = 1;
  const CONSENT_STORAGE_KEY = "jothi_cookie_consent_v1";
  const PENDING_ENQUIRY_KEY = "jothi_pending_enquiry_v1";
  const CONSUMED_ENQUIRY_KEY = "jothi_consumed_enquiry_v1";
  const PENDING_EXPIRY_MS = 10 * 60 * 1000;
  const SUCCESS_PATH = "/consultation-request-received";

  let currentConsent = readConsentPreference();
  let metaScriptPromise = null;
  let pixelInitialised = false;
  let pageViewSent = false;
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

  function readConsentPreference() {
    const preference = readJson(window.localStorage, CONSENT_STORAGE_KEY);
    if (
      !preference ||
      preference.version !== CONSENT_VERSION ||
      typeof preference.marketing !== "boolean" ||
      typeof preference.timestamp !== "string"
    ) {
      return null;
    }
    return preference;
  }

  function hasMarketingConsent() {
    return currentConsent?.marketing === true;
  }

  function saveConsentPreference(marketing) {
    currentConsent = {
      version: CONSENT_VERSION,
      marketing,
      timestamp: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(currentConsent));
    } catch (_error) {
      // The in-memory choice still applies for this page if storage is unavailable.
    }

    if (marketing) {
      loadMetaPixel().then(trySendVerifiedLead).catch(function () {
        // A blocked or failed Meta request must not affect access to the site.
      });
    }
  }

  function createMetaQueue() {
    if (typeof window.fbq === "function") return;

    const fbq = function () {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }

  function loadMetaPixel() {
    if (!hasMarketingConsent()) {
      return Promise.resolve(false);
    }

    if (!metaScriptPromise) {
      createMetaQueue();
      metaScriptPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        script.dataset.jothiMetaPixel = "true";
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", reject, { once: true });
        document.head.appendChild(script);
      });
    }

    return metaScriptPromise.then(function () {
      if (!hasMarketingConsent() || typeof window.fbq !== "function") return false;

      if (!pixelInitialised) {
        window.fbq("init", META_PIXEL_ID);
        pixelInitialised = true;
      }

      if (!pageViewSent) {
        window.fbq("track", "PageView");
        pageViewSent = true;
      }

      return true;
    });
  }

  function isSuccessPage() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === SUCCESS_PATH;
  }

  function removeUnexpectedSuccessPageParameters() {
    if (
      isSuccessPage() &&
      (window.location.search || window.location.hash) &&
      typeof window.history?.replaceState === "function"
    ) {
      window.history.replaceState(null, "", SUCCESS_PATH);
    }
  }

  function getFreshPendingEnquiry() {
    const marker = readJson(window.sessionStorage, PENDING_ENQUIRY_KEY);
    if (
      !marker ||
      marker.version !== 1 ||
      typeof marker.id !== "string" ||
      typeof marker.createdAt !== "number"
    ) {
      return null;
    }

    const age = Date.now() - marker.createdAt;
    if (age < 0 || age > PENDING_EXPIRY_MS) {
      try {
        window.sessionStorage.removeItem(PENDING_ENQUIRY_KEY);
      } catch (_error) {
        // An expired marker is ignored even if browser storage cannot be updated.
      }
      return null;
    }

    const consumed = readJson(window.sessionStorage, CONSUMED_ENQUIRY_KEY);
    if (consumedMarkerIdThisPage === marker.id || consumed?.id === marker.id) return null;
    return marker;
  }

  function consumePendingEnquiry(marker) {
    consumedMarkerIdThisPage = marker.id;
    try {
      window.sessionStorage.removeItem(PENDING_ENQUIRY_KEY);
      window.sessionStorage.setItem(
        CONSUMED_ENQUIRY_KEY,
        JSON.stringify({ id: marker.id, consumedAt: Date.now() }),
      );
    } catch (_error) {
      // The in-memory guard below still prevents another event on this page view.
    }
  }

  function trySendVerifiedLead() {
    if (leadAttemptInProgress || !isSuccessPage() || !hasMarketingConsent()) return;

    const marker = getFreshPendingEnquiry();
    if (!marker) return;
    leadAttemptInProgress = true;

    loadMetaPixel()
      .then(function (ready) {
        if (!ready || !hasMarketingConsent() || typeof window.fbq !== "function") return;
        window.fbq("track", "Lead");
        consumePendingEnquiry(marker);
      })
      .catch(function () {
        // Keep the fresh marker so a later consented retry can still be attempted.
      })
      .finally(function () {
        leadAttemptInProgress = false;
      });
  }

  function createSubmissionMarker() {
    const marker = {
      version: 1,
      id:
        typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(36).slice(2),
      createdAt: Date.now(),
    };

    try {
      window.sessionStorage.setItem(PENDING_ENQUIRY_KEY, JSON.stringify(marker));
    } catch (_error) {
      // Measurement storage failure must never prevent a genuine enquiry.
    }
  }

  window.prepareBiginEnquirySubmission = function () {
    if (typeof window.checkMandatory985999000000548437 !== "function") {
      return false;
    }

    const isValid = window.checkMandatory985999000000548437();
    if (!isValid) return false;

    createSubmissionMarker();
    return true;
  };

  removeUnexpectedSuccessPageParameters();

  function buildConsentInterface() {
    const container = document.createElement("div");
    container.className = "cookie-consent";
    container.innerHTML = `
      <button class="cookie-settings-trigger" type="button" data-cookie-settings-open${currentConsent ? "" : " hidden"}>Cookie settings</button>
      <section class="cookie-banner" data-cookie-banner aria-label="Cookie choices"${currentConsent ? " hidden" : ""}>
        <div>
          <h2>Optional cookies</h2>
          <p>We use essential storage for your choices. With your permission, Meta marketing technology helps us measure advertising and enquiries. The website and enquiry form still work if you reject it. Read our <a href="/cookies.html">Cookies Notice</a>.</p>
        </div>
        <div class="cookie-banner-actions">
          <button type="button" data-cookie-accept>Accept optional cookies</button>
          <button type="button" data-cookie-reject>Reject optional cookies</button>
          <button type="button" data-cookie-settings-open>Cookie settings</button>
        </div>
      </section>
      <div class="cookie-dialog-backdrop" data-cookie-dialog-backdrop hidden>
        <section class="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title" tabindex="-1">
          <div class="cookie-dialog-heading">
            <h2 id="cookie-dialog-title">Cookie settings</h2>
            <button type="button" class="cookie-dialog-close" data-cookie-dialog-close aria-label="Close cookie settings">×</button>
          </div>
          <div class="cookie-choice">
            <div>
              <h3>Essential</h3>
              <p>Required for site operation and to remember your cookie choice.</p>
            </div>
            <span>Always active</span>
          </div>
          <label class="cookie-choice" for="cookie-marketing-choice">
            <div>
              <h3>Marketing</h3>
              <p>Allows Meta Pixel to measure page visits and successful enquiries.</p>
            </div>
            <input id="cookie-marketing-choice" type="checkbox" data-cookie-marketing>
          </label>
          <div class="cookie-dialog-actions">
            <button type="button" data-cookie-save>Save choices</button>
          </div>
        </section>
      </div>`;
    document.body.appendChild(container);

    const banner = container.querySelector("[data-cookie-banner]");
    const persistentSettingsButton = container.querySelector(".cookie-settings-trigger");
    const backdrop = container.querySelector("[data-cookie-dialog-backdrop]");
    const dialog = container.querySelector(".cookie-dialog");
    const marketingChoice = container.querySelector("[data-cookie-marketing]");
    let lastFocusedElement = null;

    function closeDialog() {
      backdrop.hidden = true;
      document.body.classList.remove("cookie-dialog-open");
      lastFocusedElement?.focus();
    }

    function openDialog(event) {
      lastFocusedElement = event?.currentTarget || document.activeElement;
      marketingChoice.checked = hasMarketingConsent();
      backdrop.hidden = false;
      document.body.classList.add("cookie-dialog-open");
      dialog.focus();
    }

    function applyChoice(marketing) {
      saveConsentPreference(marketing);
      banner.hidden = true;
      persistentSettingsButton.hidden = false;
      closeDialog();
    }

    container.querySelectorAll("[data-cookie-settings-open]").forEach(function (button) {
      button.addEventListener("click", openDialog);
    });
    container.querySelector("[data-cookie-accept]").addEventListener("click", function () {
      applyChoice(true);
    });
    container.querySelector("[data-cookie-reject]").addEventListener("click", function () {
      applyChoice(false);
    });
    container.querySelector("[data-cookie-save]").addEventListener("click", function () {
      applyChoice(marketingChoice.checked);
    });
    container.querySelector("[data-cookie-dialog-close]").addEventListener("click", closeDialog);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) closeDialog();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !backdrop.hidden) closeDialog();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildConsentInterface, { once: true });
  } else {
    buildConsentInterface();
  }

  if (hasMarketingConsent()) {
    loadMetaPixel().then(trySendVerifiedLead).catch(function () {
      // A blocked or failed Meta request must not affect access to the site.
    });
  }
})();
