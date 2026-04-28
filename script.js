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
