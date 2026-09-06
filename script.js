const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const contactForm = document.querySelector(".contact-form-card");
const accessKeyField = contactForm?.querySelector('input[name="access_key"]');
const contactSubmitButton = contactForm?.querySelector('button[type="submit"]');
const formStatus = contactForm?.querySelector("[data-form-status]");

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

if (contactForm && accessKeyField && formStatus) {
  const defaultSubmitLabel = contactSubmitButton?.textContent ?? "Send enquiry";

  const setFormStatus = (message, state) => {
    formStatus.textContent = message;
    formStatus.hidden = false;
    formStatus.dataset.state = state;
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      return;
    }

    const formData = new FormData(contactForm);

    setFormStatus("Sending your enquiry...", "sending");

    if (contactSubmitButton) {
      contactSubmitButton.disabled = true;
      contactSubmitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Something went wrong while sending your enquiry.");
      }

      contactForm.reset();
      setFormStatus("Your enquiry has been sent. We will be in touch shortly.", "success");
    } catch (error) {
      setFormStatus(
        error instanceof Error ? error.message : "We could not send your enquiry. Please try again.",
        "error",
      );
    } finally {
      if (contactSubmitButton) {
        contactSubmitButton.disabled = false;
        contactSubmitButton.textContent = defaultSubmitLabel;
      }
    }
  });
}

// Programme pricing presentation v2 — 2026-09-06.
// Public pages show whole-programme fees; payment plans are discussed during consultation.
(function () {
  if (document.documentElement.dataset.programmePricingV2 === "true") return;
  document.documentElement.dataset.programmePricingV2 = "true";

  function setText(selector, text, root) {
    const node = (root || document).querySelector(selector);
    if (node) node.textContent = text;
  }

  function updateHomepagePricing() {
    const pricing = document.getElementById("pricing");
    if (!pricing) return;

    const intro = pricing.querySelectorAll(".section-heading .section-intro");
    if (intro[0]) {
      intro[0].textContent = "Our programmes are priced as complete academic programmes. Payment plans are available after consultation.";
    }
    if (intro[1]) {
      intro[1].textContent = "The programme fee covers the agreed teaching cycle: lessons, testing, progress tracking, parent updates, and pathway guidance.";
    }

    const cards = [
      ["programmes.html#ks3-programmes", "From £880 programme fee"],
      ["programmes.html#gcse-prep", "From £1,100 programme fee"],
      ["programmes.html#year-11", "From £1,000 programme fee"],
      ["programmes.html#a-level-maths", "From £2,200 programme fee"],
    ];

    cards.forEach(function ([href, price]) {
      const card = pricing.querySelector('a[href="' + href + '"] .pricing-card');
      if (!card) return;
      const priceNode = card.querySelector("strong");
      if (priceNode) priceNode.textContent = price;

      if (href === "programmes.html#a-level-maths") {
        const stage = card.querySelector("span:not(.pricing-card-cta)");
        if (stage) stage.textContent = "Year 12 and Year 13";
        const copy = card.querySelectorAll("p");
        if (copy[1]) copy[1].textContent = "Year 12 foundations, Year 13 exam preparation, and specialist pathways.";
      }
    });

    const note = pricing.querySelector(".pricing-snapshot-note");
    if (note) {
      note.textContent = "Multi-subject, exam-year, specialist pathways, and payment-plan options are recommended after consultation.";
    }
  }

  function feePanel(sectionId, rows) {
    const panel = document.querySelector(sectionId + " .programme-fee-panel");
    if (!panel) return;

    const heading = panel.querySelector("h3");
    if (heading) heading.textContent = "Programme fees";

    const list = panel.querySelector(".programme-fee-list");
    if (!list) return;

    const joining = '<div><dt>Joining route</dt><dd><a class="programme-fee-link" href="contact.html#contact-form">Start with a consultation →</a></dd></div>';
    list.innerHTML = rows.join("") + '<div><dt>Payment plans</dt><dd>Available after consultation</dd></div>' + joining;
  }

  function updateProgrammesPricing() {
    const programmeNav = document.getElementById("programme-stage-nav");
    if (!programmeNav) return;

    const heroBody = document.querySelector(".programme-hero .hero-body");
    if (heroBody) {
      heroBody.textContent = "Explore the right route for your child’s year group, then compare programme options, programme fees, and the best joining route.";
    }

    const formatNote = document.querySelector(".programme-format-note-section .programme-inclusions-support");
    if (formatNote) {
      formatNote.textContent = "Full Core programme fees include a small combined-programme reduction. Payment plans are available after consultation.";
    }

    feePanel("#ks2-programmes", [
      "<div><dt>1 subject</dt><dd>£825 programme fee</dd></div>",
      "<div><dt>2-subject pathway</dt><dd>£1,650 programme fee</dd></div>",
      "<div><dt>Programme cycle</dt><dd>September–July</dd></div>",
    ]);

    feePanel("#ks3-programmes", [
      "<div><dt>1 subject / standard pathway</dt><dd>£880 programme fee</dd></div>",
      "<div><dt>2-session pathway</dt><dd>£1,760 programme fee</dd></div>",
      "<div><dt>Full Core Foundations</dt><dd>£2,420 programme fee</dd></div>",
      "<div><dt>Programme cycle</dt><dd>September–July</dd></div>",
    ]);

    feePanel("#gcse-prep", [
      "<div><dt>1 subject</dt><dd>£1,100 programme fee</dd></div>",
      "<div><dt>2-subject pathway</dt><dd>£2,200 programme fee</dd></div>",
      "<div><dt>GCSE Full Core</dt><dd>£3,025 programme fee</dd></div>",
      "<div><dt>Programme cycle</dt><dd>September–July</dd></div>",
    ]);

    feePanel("#year-11", [
      "<div><dt>1 subject</dt><dd>£1,000 programme fee</dd></div>",
      "<div><dt>2-subject pathway</dt><dd>£2,000 programme fee</dd></div>",
      "<div><dt>Full Core Exam Programme</dt><dd>£2,760 programme fee</dd></div>",
      "<div><dt>Programme cycle</dt><dd>September–April</dd></div>",
    ]);

    feePanel("#a-level-maths", [
      "<div><dt>Year 12 A-Level Maths</dt><dd>£2,200 programme fee</dd></div>",
      "<div><dt>Year 12 programme cycle</dt><dd>September–May</dd></div>",
      "<div><dt>Year 13 A-Level Maths</dt><dd>£2,500 programme fee</dd></div>",
      "<div><dt>Year 13 programme cycle</dt><dd>September–April</dd></div>",
      "<div><dt>University admissions or accelerated routes</dt><dd>Discussed after consultation</dd></div>",
    ]);

    const faqList = document.querySelector("#programme-faq .programme-faq-list");
    if (!faqList || faqList.dataset.programmePricingFaq === "true") return;

    const feeQuestion = Array.from(faqList.querySelectorAll(".programme-faq-item")).find(function (item) {
      return item.querySelector("summary")?.textContent.trim() === "What does the monthly fee cover?";
    });

    if (!feeQuestion) return;

    const summary = feeQuestion.querySelector("summary");
    const answer = feeQuestion.querySelector(".programme-faq-answer");
    if (summary) summary.textContent = "Why does Jothi show a programme fee instead of a monthly tuition price?";
    if (answer) {
      answer.innerHTML = "<p>Jothi programmes combine curriculum teaching, supervised revision, assessment, and exam preparation across a defined academic cycle.</p><p>The fee therefore represents the programme as a whole rather than a fixed number of lessons in each calendar month.</p>";
    }

    feeQuestion.insertAdjacentHTML("afterend", `
      <details class="programme-faq-item">
        <summary>Are payment plans available?</summary>
        <div class="programme-faq-answer">
          <p>Yes. Payment plans can be discussed during consultation and agreed before enrolment.</p>
          <p>The payment plan spreads the programme fee across an agreed period; it does not change the academic programme.</p>
        </div>
      </details>
      <details class="programme-faq-item">
        <summary>How might a payment plan work?</summary>
        <div class="programme-faq-answer">
          <p>For example, if a programme fee were £2,400:</p>
          <p>8-month plan: 8 payments of £300<br>10-month plan: 10 payments of £240<br>12-month plan: 12 payments of £200</p>
          <p>This is an illustration only. Your actual payment plan will depend on the programme fee, start date, and arrangement agreed during consultation.</p>
        </div>
      </details>
    `);

    faqList.dataset.programmePricingFaq = "true";
  }

  updateHomepagePricing();
  updateProgrammesPricing();
})();
